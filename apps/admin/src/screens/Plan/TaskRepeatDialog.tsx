import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { TaskFolder, TaskRepeatFreq, TaskRepeatRule } from '@vallista/content-core';
import {
  addTaskRepeat,
  deleteTaskRepeat,
  listTaskRepeats,
  updateTaskRepeat,
  type TaskRepeatInput,
  type TaskRepeatView,
} from '../../lib/tauri';
import {
  Checkbox,
  Eyebrow,
  Input,
  Mono,
  Select,
  type SelectOption,
} from '../../components/atoms/Atoms';
import { LabelPicker } from '../../components/LabelPicker';
import { GroupInput } from '../../components/TaskGroup';
import { folderOptions } from './taskFolders';
import { resolveLabel } from './labelCatalog';

interface Props {
  open: boolean;
  folders: TaskFolder[];
  groupSuggestions: string[];
  onClose: () => void;
}

interface Draft {
  id?: string;
  title: string;
  freq: TaskRepeatFreq;
  interval: string;
  weekdays: number[];
  monthDay: string;
  startDate: string;
  time: string;
  estMin: string;
  folderId: string;
  group: string;
  kind: string;
  color: string;
  enabled: boolean;
}

const WEEKDAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];
const WEEKDAY_PRESET = [1, 2, 3, 4, 5];

const FREQ_OPTIONS: SelectOption<TaskRepeatFreq>[] = [
  { value: 'daily', label: '매일 · N일마다' },
  { value: 'weekly', label: '매주 · 요일 선택' },
  { value: 'monthly', label: '매월 N일' },
];

function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyDraft(): Draft {
  return {
    title: '',
    freq: 'daily',
    interval: '1',
    weekdays: [...WEEKDAY_PRESET],
    monthDay: '1',
    startDate: todayLocal(),
    time: '',
    estMin: '',
    folderId: '',
    group: '',
    kind: 'write',
    color: '',
    enabled: true,
  };
}

function draftOf(v: TaskRepeatView): Draft {
  return {
    id: v.id,
    title: v.title,
    freq: v.rule.freq,
    interval: String(v.rule.interval || 1),
    weekdays: v.rule.weekdays.length > 0 ? [...v.rule.weekdays] : [...WEEKDAY_PRESET],
    monthDay: String(v.rule.monthDay || 1),
    startDate: v.startDate,
    time: v.time ?? '',
    estMin: v.estMin ? String(v.estMin) : '',
    folderId: v.folderId ?? '',
    group: v.group ?? '',
    kind: v.kind ?? 'write',
    color: v.color ?? '',
    enabled: v.enabled,
  };
}

function clampInt(s: string, max: number): number {
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(0, n), max);
}

function toInput(d: Draft): TaskRepeatInput {
  const rule: TaskRepeatRule = {
    freq: d.freq,
    interval: d.freq === 'monthly' ? 1 : clampInt(d.interval, 9999),
    weekdays: d.freq === 'weekly' ? d.weekdays : [],
    monthDay: d.freq === 'monthly' ? clampInt(d.monthDay, 255) : 1,
  };
  const estMin = clampInt(d.estMin, 100000);
  return {
    title: d.title.trim(),
    rule,
    time: d.time || undefined,
    estMin: estMin > 0 ? estMin : undefined,
    folderId: d.folderId || undefined,
    group: d.group.trim() || undefined,
    kind: d.kind || undefined,
    color: d.color || undefined,
    enabled: d.enabled,
    startDate: d.startDate,
  };
}

function inputOf(v: TaskRepeatView, enabled: boolean): TaskRepeatInput {
  return {
    title: v.title,
    rule: v.rule,
    time: v.time,
    estMin: v.estMin,
    folderId: v.folderId,
    group: v.group,
    kind: v.kind,
    color: v.color,
    enabled,
    startDate: v.startDate,
  };
}

function isWeekdayPreset(days: number[]): boolean {
  return days.length === 5 && WEEKDAY_PRESET.every((d) => days.includes(d));
}

function describeRule(v: Pick<TaskRepeatView, 'rule' | 'time'>): string {
  const { freq, interval, weekdays, monthDay } = v.rule;
  let text: string;
  if (freq === 'daily') {
    text = interval <= 1 ? '매일' : `${interval}일마다`;
  } else if (freq === 'weekly') {
    const days = isWeekdayPreset(weekdays)
      ? '평일'
      : WEEKDAYS.filter((w) => weekdays.includes(w.value))
          .map((w) => w.label)
          .join('·');
    if (interval <= 1) {
      text = days === '평일' ? '평일' : `매주 ${days}`;
    } else {
      text = `${interval}주마다 ${days}`;
    }
  } else {
    text = `매월 ${monthDay}일`;
  }
  return v.time ? `${text} ${v.time}` : text;
}

function statusOf(v: TaskRepeatView): string {
  if (!v.enabled) return '일시 정지';
  if (v.pendingTaskId) return '미완료 회차 있음';
  if (v.nextKey) return `다음 ${v.nextKey.slice(5)}`;
  return '';
}

export function TaskRepeatDialog({ open, folders, groupSuggestions, onClose }: Props) {
  const [rules, setRules] = useState<TaskRepeatView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setDraft(null);
    setError(null);
    setConfirmDeleteId(null);
    setLoading(true);
    listTaskRepeats()
      .then((items) => {
        if (!cancelled) setRules(items);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = window.setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteId]);

  useEffect(() => {
    if (!open || draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, draft, onClose]);

  if (!open) return null;

  const reload = async () => {
    const items = await listTaskRepeats();
    setRules(items);
  };

  const notifyTasks = () => window.dispatchEvent(new CustomEvent('bento:tasks-changed'));

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const submit = async () => {
    if (!draft || busy) return;
    if (!draft.title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const input = toInput(draft);
      if (draft.id) {
        await updateTaskRepeat(draft.id, input);
      } else {
        await addTaskRepeat(input);
      }
      notifyTasks();
      await reload();
      setDraft(null);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (v: TaskRepeatView) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateTaskRepeat(v.id, inputOf(v, !v.enabled));
      notifyTasks();
      await reload();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (v: TaskRepeatView) => {
    if (busy) return;
    if (confirmDeleteId !== v.id) {
      setConfirmDeleteId(v.id);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteTaskRepeat(v.id);
      setConfirmDeleteId(null);
      await reload();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const canSave = !!draft && !!draft.title.trim() && !busy;

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
          gap: 12,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>{draft ? (draft.id ? '반복 편집' : '새 반복') : '반복 할 일'}</Eyebrow>
          <button onClick={onClose} title="닫기 (ESC)" style={iconBtnStyle}>
            ×
          </button>
        </div>

        {error && <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>}

        {draft ? (
          <>
            <Input
              autoFocus
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setDraft(null);
                }
              }}
              placeholder="제목 (예: 주간 회고 쓰기)"
              style={{
                padding: '9px 11px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--bg)',
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="주기">
                <Select
                  value={draft.freq}
                  options={FREQ_OPTIONS}
                  onChange={(v) => update({ freq: v ?? 'daily' })}
                />
              </Field>
              {draft.freq === 'monthly' ? (
                <Field label="날짜 (1~31, 없는 날은 말일)">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={draft.monthDay}
                    onChange={(e) => update({ monthDay: e.target.value })}
                    sm
                  />
                </Field>
              ) : (
                <Field label={draft.freq === 'daily' ? '간격 (일)' : '간격 (주)'}>
                  <Input
                    type="number"
                    min={1}
                    max={draft.freq === 'daily' ? 365 : 52}
                    value={draft.interval}
                    onChange={(e) => update({ interval: e.target.value })}
                    sm
                  />
                </Field>
              )}
            </div>

            {draft.freq === 'weekly' && (
              <Field label="요일">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  {WEEKDAYS.map((w) => {
                    const on = draft.weekdays.includes(w.value);
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() =>
                          update({
                            weekdays: on
                              ? draft.weekdays.filter((d) => d !== w.value)
                              : [...draft.weekdays, w.value],
                          })
                        }
                        style={{
                          width: 32,
                          padding: '5px 0',
                          fontSize: 11.5,
                          border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`,
                          background: on ? 'var(--ink)' : 'transparent',
                          color: on ? 'var(--on-accent)' : 'var(--ink-soft)',
                          borderRadius: 4,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => update({ weekdays: [...WEEKDAY_PRESET] })}
                    style={{ ...rowBtnStyle, marginLeft: 4 }}
                  >
                    평일
                  </button>
                </div>
              </Field>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="시작일">
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  sm
                />
              </Field>
              <Field label="시간 (선택)">
                <Input
                  type="time"
                  value={draft.time}
                  onChange={(e) => update({ time: e.target.value })}
                  step={300}
                  sm
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="예상 시간 (분, 선택)">
                <Input
                  type="number"
                  min={0}
                  value={draft.estMin}
                  onChange={(e) => update({ estMin: e.target.value })}
                  placeholder="0"
                  sm
                />
              </Field>
              <Field label="폴더">
                <Select
                  value={draft.folderId}
                  options={folderOptions(folders)}
                  placeholder="폴더 없음"
                  onChange={(v) => update({ folderId: v ?? '' })}
                />
              </Field>
            </div>

            <Field label="구분">
              <GroupInput
                value={draft.group}
                onChange={(g) => update({ group: g })}
                suggestions={groupSuggestions}
                sm
              />
            </Field>

            <Field label="종류 · 색상">
              <LabelPicker
                kind={draft.kind}
                color={draft.color}
                onChange={(k, c) => update({ kind: k, color: c })}
              />
            </Field>

            <Checkbox checked={draft.enabled} onChange={(v) => update({ enabled: v })}>
              사용 중 (끄면 새 회차를 만들지 않음)
            </Checkbox>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button onClick={() => setDraft(null)} style={cancelBtnStyle}>
                취소
              </button>
              <button onClick={submit} disabled={!canSave} style={primaryBtnStyle(canSave)}>
                {busy ? '…' : '저장'}
              </button>
            </div>
          </>
        ) : (
          <>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              회차 날짜가 되면 할 일을 하나 만듭니다. 이전 회차가 미완료면 다음 회차를 만들지
              않습니다.
            </Mono>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading && rules.length === 0 ? (
                <Mono style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>
              ) : rules.length === 0 ? (
                <Mono style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                  반복 규칙이 없습니다.
                </Mono>
              ) : (
                rules.map((r) => (
                  <RuleRow
                    key={r.id}
                    rule={r}
                    busy={busy}
                    confirming={confirmDeleteId === r.id}
                    onEdit={() => {
                      setError(null);
                      setDraft(draftOf(r));
                    }}
                    onToggle={() => void toggleEnabled(r)}
                    onDelete={() => void remove(r)}
                  />
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button onClick={onClose} style={cancelBtnStyle}>
                닫기
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setDraft(emptyDraft());
                }}
                style={primaryBtnStyle(true)}
              >
                + 새 반복
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  busy,
  confirming,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: TaskRepeatView;
  busy: boolean;
  confirming: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const status = statusOf(rule);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        border: '1px solid var(--line)',
        borderLeft: `3px solid ${resolveLabel(rule.kind, rule.color).color}`,
        background: 'var(--bg)',
        borderRadius: 6,
        opacity: rule.enabled ? 1 : 0.6,
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
          {rule.title}
        </span>
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
          {describeRule(rule)}
          {status && ` · ${status}`}
        </Mono>
      </div>
      <button onClick={onEdit} disabled={busy} style={rowBtnStyle}>
        편집
      </button>
      <button onClick={onToggle} disabled={busy} style={rowBtnStyle}>
        {rule.enabled ? '일시 정지' : '재개'}
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        style={{
          ...rowBtnStyle,
          border: `1px solid ${confirming ? 'var(--err)' : 'var(--line)'}`,
          background: confirming ? 'var(--err)' : 'transparent',
          color: confirming ? 'var(--on-accent)' : 'var(--err)',
        }}
      >
        {confirming ? '한 번 더' : '삭제'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{label}</Mono>
      {children}
    </div>
  );
}

const iconBtnStyle: CSSProperties = {
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

const rowBtnStyle: CSSProperties = {
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

const cancelBtnStyle: CSSProperties = {
  padding: '7px 14px',
  fontSize: 12,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink-soft)',
  borderRadius: 6,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function primaryBtnStyle(enabled: boolean): CSSProperties {
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
