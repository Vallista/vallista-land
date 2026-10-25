import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Routine, RoutineColor, RoutineSlot } from '@vallista/content-core';
import {
  addRoutine,
  deleteRoutine,
  reorderRoutines,
  setRoutineArchived,
  updateRoutine,
  type RoutineInput,
} from '../../lib/tauri';
import { dispatchToast } from '../../components/NotifToast';
import { Eyebrow, Input, Mono } from '../../components/atoms/Atoms';
import { describeSchedule, slotLabel, type DayKey } from '../../lib/routineStats';
import {
  ROUTINE_COLORS,
  ROUTINE_TEMPLATES,
  SLOT_META,
  SLOT_ORDER,
  WEEKDAY_BUTTONS,
  routineColor,
  type RoutineTemplate,
} from './meta';

export type DialogInit =
  | { mode: 'list' }
  | { mode: 'new'; template?: RoutineTemplate }
  | { mode: 'edit'; id: string };

interface Props {
  init: DialogInit | null;
  routines: Routine[];
  today: DayKey;
  onClose: () => void;
  /** 저장·보관·삭제·순서 변경 뒤. 부모가 다시 불러온다 */
  onChanged: () => Promise<void> | void;
}

interface Draft {
  id?: string;
  title: string;
  color: RoutineColor;
  slot: RoutineSlot;
  freq: 'daily' | 'weekly';
  weekdays: number[];
  goalMin: string;
  startDate: string;
}

function freeColor(routines: Routine[]): RoutineColor {
  const used = new Set(routines.filter((r) => !r.archivedAt).map((r) => r.color));
  return ROUTINE_COLORS.find((c) => !used.has(c.key))?.key ?? 'blue';
}

function newDraft(routines: Routine[], today: DayKey, t?: RoutineTemplate): Draft {
  return {
    title: t?.title ?? '',
    color: freeColor(routines),
    slot: t?.slot ?? 'anytime',
    freq: t?.weekdays ? 'weekly' : 'daily',
    weekdays: t?.weekdays ?? [1, 2, 3, 4, 5],
    goalMin: t?.goalMin ? String(t.goalMin) : '',
    startDate: today,
  };
}

function draftOf(r: Routine): Draft {
  return {
    id: r.id,
    title: r.title,
    color: r.color,
    slot: r.slot,
    freq: r.schedule.freq,
    weekdays: r.schedule.freq === 'weekly' ? [...r.schedule.weekdays] : [1, 2, 3, 4, 5],
    goalMin: r.goalMin ? String(r.goalMin) : '',
    startDate: r.startDate,
  };
}

function toInput(d: Draft): RoutineInput {
  const goal = Number.parseInt(d.goalMin, 10);
  return {
    title: d.title.trim(),
    color: d.color,
    slot: d.slot,
    schedule: { freq: d.freq, weekdays: d.freq === 'weekly' ? d.weekdays : [] },
    goalMin: Number.isFinite(goal) && goal > 0 ? goal : undefined,
    startDate: d.startDate,
  };
}

export function RoutineDialog({ init, routines, today, onClose, onChanged }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fromList, setFromList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!init) return;
    setError(null);
    setConfirmDelete(null);
    setFromList(init.mode === 'list');
    if (init.mode === 'new') setDraft(newDraft(routines, today, init.template));
    else if (init.mode === 'edit') {
      const r = routines.find((x) => x.id === init.id);
      setDraft(r ? draftOf(r) : null);
    } else setDraft(null);
    // routines가 바뀔 때마다 편집 중 초안을 덮어쓰지 않도록 init이 바뀔 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = window.setTimeout(() => setConfirmDelete(null), 4000);
    return () => window.clearTimeout(t);
  }, [confirmDelete]);

  const back = () => {
    if (draft && fromList) {
      setDraft(null);
      setError(null);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!init) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        back();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!init) return null;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      if (!draft) return;
      const input = toInput(draft);
      if (draft.id) await updateRoutine(draft.id, input);
      else await addRoutine(input);
      if (fromList) setDraft(null);
      else onClose();
    });

  const toggleArchive = (r: Routine) =>
    run(async () => {
      await setRoutineArchived(r.id, !r.archivedAt);
      if (draft?.id === r.id && !fromList) onClose();
      else setDraft(null);
    });

  const remove = (r: Routine) => {
    if (confirmDelete !== r.id) {
      setConfirmDelete(r.id);
      return;
    }
    void run(async () => {
      const res = await deleteRoutine(r.id);
      setConfirmDelete(null);
      dispatchToast({
        title: `‘${r.title}’ 삭제`,
        body: `기록 ${res.removedLogs}개도 함께 지웠어요. 백업: ${res.backupPath}`,
        duration: 0,
      });
      if (!fromList) onClose();
      else setDraft(null);
    });
  };

  const active = routines.filter((r) => !r.archivedAt);
  const archived = routines.filter((r) => r.archivedAt);

  const move = (id: string, dir: -1 | 1) =>
    run(async () => {
      const ids = active.map((r) => r.id);
      const i = ids.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
      await reorderRoutines([...ids, ...archived.map((r) => r.id)]);
    });

  const editing = draft?.id ? routines.find((r) => r.id === draft.id) : undefined;
  const canSave =
    !!draft &&
    !!draft.title.trim() &&
    !busy &&
    (draft.freq === 'daily' || draft.weekdays.length > 0);
  const update = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 94vw)',
          maxHeight: '88vh',
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-pop)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>{draft ? (draft.id ? '루틴 편집' : '새 루틴') : '루틴 관리'}</Eyebrow>
          <button onClick={onClose} title="닫기 (ESC)" style={closeBtn}>
            ×
          </button>
        </div>

        {error && <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>}

        {draft ? (
          <>
            <Input
              autoFocus
              value={draft.title}
              maxLength={60}
              onChange={(e) => update({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) void save();
              }}
              placeholder="루틴 이름 (예: 독서 20분)"
              style={{
                padding: '9px 11px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--bg)',
              }}
            />
            {!draft.id && !draft.title && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ROUTINE_TEMPLATES.map((t) => (
                  <button
                    key={t.title}
                    onClick={() =>
                      setDraft({ ...newDraft(routines, today, t), color: draft.color })
                    }
                    style={chipBtn(false)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <Field label="색상">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {ROUTINE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => update({ color: c.key })}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={draft.color === c.key}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      border: 'none',
                      padding: 0,
                      background: routineColor(c.key),
                      outline: draft.color === c.key ? '2px solid var(--ink)' : 'none',
                      outlineOffset: 2,
                      cursor: 'pointer',
                    }}
                  />
                ))}
                <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  {ROUTINE_COLORS.find((c) => c.key === draft.color)?.label}
                </Mono>
              </div>
            </Field>

            <Field label="시간대">
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SLOT_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ slot: s })}
                    style={chipBtn(draft.slot === s)}
                  >
                    {SLOT_META[s].label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="반복">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => update({ freq: 'daily' })}
                    style={chipBtn(draft.freq === 'daily')}
                  >
                    매일
                  </button>
                  <button
                    onClick={() => update({ freq: 'weekly' })}
                    style={chipBtn(draft.freq === 'weekly')}
                  >
                    요일 선택
                  </button>
                </div>
                {draft.freq === 'weekly' && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {WEEKDAY_BUTTONS.map((w) => {
                      const on = draft.weekdays.includes(w.value);
                      return (
                        <button
                          key={w.value}
                          onClick={() =>
                            update({
                              weekdays: on
                                ? draft.weekdays.filter((d) => d !== w.value)
                                : [...draft.weekdays, w.value],
                            })
                          }
                          aria-pressed={on}
                          style={{ ...chipBtn(on), width: 34, padding: '5px 0', borderRadius: 4 }}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                    <button onClick={() => update({ weekdays: [1, 2, 3, 4, 5] })} style={rowBtn}>
                      평일
                    </button>
                    <button onClick={() => update({ weekdays: [0, 6] })} style={rowBtn}>
                      주말
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="하루 목표 시간 (분, 선택)">
                <Input
                  type="number"
                  min={0}
                  max={600}
                  sm
                  value={draft.goalMin}
                  placeholder="없음"
                  onChange={(e) => update({ goalMin: e.target.value })}
                />
              </Field>
              <Field label="시작일">
                <Input
                  type="date"
                  sm
                  value={draft.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                />
              </Field>
            </div>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
              목표 시간을 정하면 타이머나 직접 입력으로 채웠을 때 자동으로 완료돼요. 시작일 이전
              날짜는 기록할 수 없고, 스트릭과 달성률도 시작일부터 셉니다.
            </Mono>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {editing && (
                <>
                  <button
                    onClick={() => void toggleArchive(editing)}
                    disabled={busy}
                    style={rowBtn}
                  >
                    {editing.archivedAt ? '보관함에서 꺼내기' : '보관'}
                  </button>
                  <button
                    onClick={() => remove(editing)}
                    disabled={busy}
                    style={dangerBtn(confirmDelete === editing.id)}
                  >
                    {confirmDelete === editing.id ? '기록까지 삭제 — 한 번 더' : '삭제'}
                  </button>
                </>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={back} style={cancelBtn}>
                  {fromList ? '목록으로' : '취소'}
                </button>
                <button onClick={() => void save()} disabled={!canSave} style={primaryBtn(canSave)}>
                  {busy ? '…' : '저장'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
              보관하면 오늘부터 예정에서 빠지고 지난 기록은 통계에 남아요. 삭제는 기록까지 지우고
              백업을 남깁니다.
            </Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {active.length === 0 && (
                <Mono style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>루틴이 없습니다.</Mono>
              )}
              {active.map((r, i) => (
                <ListRow
                  key={r.id}
                  routine={r}
                  busy={busy}
                  confirming={confirmDelete === r.id}
                  onUp={i > 0 ? () => void move(r.id, -1) : undefined}
                  onDown={i < active.length - 1 ? () => void move(r.id, 1) : undefined}
                  onEdit={() => setDraft(draftOf(r))}
                  onArchive={() => void toggleArchive(r)}
                  onDelete={() => remove(r)}
                />
              ))}
            </div>
            {archived.length > 0 && (
              <>
                <Eyebrow style={{ marginTop: 6 }}>보관함 · {archived.length}</Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {archived.map((r) => (
                    <ListRow
                      key={r.id}
                      routine={r}
                      busy={busy}
                      confirming={confirmDelete === r.id}
                      onEdit={() => setDraft(draftOf(r))}
                      onArchive={() => void toggleArchive(r)}
                      onDelete={() => remove(r)}
                    />
                  ))}
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button onClick={onClose} style={cancelBtn}>
                닫기
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setDraft(newDraft(routines, today));
                }}
                style={primaryBtn(true)}
              >
                + 새 루틴
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListRow({
  routine: r,
  busy,
  confirming,
  onUp,
  onDown,
  onEdit,
  onArchive,
  onDelete,
}: {
  routine: Routine;
  busy: boolean;
  confirming: boolean;
  onUp?: () => void;
  onDown?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const archived = !!r.archivedAt;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        border: '1px solid var(--line)',
        borderLeft: `3px solid ${routineColor(r.color)}`,
        background: 'var(--bg)',
        borderRadius: 6,
        opacity: archived ? 0.65 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 13,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.title}
        </span>
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
          {describeSchedule(r)} · {slotLabel(r.slot)}
          {r.goalMin ? ` · 목표 ${r.goalMin}분` : ''}
          {archived ? ` · ${r.archivedAt} 보관` : ''}
        </Mono>
      </div>
      {!archived && (
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={onUp} disabled={busy || !onUp} title="위로" style={arrowBtn(!onUp)}>
            ↑
          </button>
          <button
            onClick={onDown}
            disabled={busy || !onDown}
            title="아래로"
            style={arrowBtn(!onDown)}
          >
            ↓
          </button>
        </div>
      )}
      <button onClick={onEdit} disabled={busy} style={rowBtn}>
        편집
      </button>
      <button onClick={onArchive} disabled={busy} style={rowBtn}>
        {archived ? '꺼내기' : '보관'}
      </button>
      <button onClick={onDelete} disabled={busy} style={dangerBtn(confirming)}>
        {confirming ? '한 번 더' : '삭제'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{label}</Mono>
      {children}
    </div>
  );
}

function chipBtn(on: boolean): CSSProperties {
  return {
    padding: '5px 11px',
    fontSize: 11.5,
    border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`,
    background: on ? 'var(--ink)' : 'transparent',
    color: on ? 'var(--on-accent)' : 'var(--ink-soft)',
    borderRadius: 999,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
}

function arrowBtn(disabled: boolean): CSSProperties {
  return {
    width: 22,
    height: 22,
    padding: 0,
    border: '1px solid var(--line)',
    background: 'transparent',
    color: disabled ? 'var(--ink-faint)' : 'var(--ink-soft)',
    borderRadius: 4,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  };
}

function dangerBtn(confirming: boolean): CSSProperties {
  return {
    ...rowBtn,
    border: `1px solid ${confirming ? 'var(--err)' : 'var(--line)'}`,
    background: confirming ? 'var(--err)' : 'transparent',
    color: confirming ? 'var(--on-accent)' : 'var(--err)',
  };
}

function primaryBtn(enabled: boolean): CSSProperties {
  return {
    padding: '7px 14px',
    fontSize: 12,
    border: 'none',
    background: enabled ? 'var(--ink)' : 'var(--bg-shade)',
    color: enabled ? 'var(--on-accent)' : 'var(--ink-mute)',
    borderRadius: 6,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit',
    fontWeight: 500,
  };
}

const rowBtn: CSSProperties = {
  padding: '4px 8px',
  fontSize: 11,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink-soft)',
  borderRadius: 4,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const cancelBtn: CSSProperties = {
  padding: '7px 14px',
  fontSize: 12,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink-soft)',
  borderRadius: 6,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const closeBtn: CSSProperties = {
  width: 22,
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-mute)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
};
