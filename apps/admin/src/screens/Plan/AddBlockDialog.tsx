import { useEffect, useState } from 'react';
import type { Block, BlockKind, BlockSource, KnownBlockKind } from '@vallista/content-core';
import { Button, Eyebrow, Input, Mono } from '../../components/atoms/Atoms';

const SOURCE_LABEL: Record<Exclude<BlockSource, 'local'>, string> = {
  gcal: 'Google · iCal 구독',
  applecal: 'macOS 캘린더',
};

const KINDS: { id: KnownBlockKind; label: string }[] = [
  { id: 'meet', label: '미팅' },
  { id: 'write', label: '글쓰기' },
  { id: 'read', label: '독서' },
  { id: 'deep', label: '몰입' },
  { id: 'build', label: '제작' },
  { id: 'publish', label: '배포' },
  { id: 'health', label: '건강' },
  { id: 'meal', label: '식사' },
  { id: 'leisure', label: '여가' },
  { id: 'people', label: '사람' },
  { id: 'routine', label: '루틴' },
  { id: 'life', label: '일상' },
];

export interface AddBlockDraft {
  date: string;
  start: string;
  end: string;
  endDate?: string;
  title: string;
  kind: BlockKind;
  customLabel?: string;
  attendees: string[];
}

export function AddBlockDialog({
  open,
  initial,
  onSubmit,
  onClose,
  onDelete,
  editingId,
  source,
}: {
  open: boolean;
  initial: Partial<AddBlockDraft> | null;
  onSubmit: (draft: AddBlockDraft) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  editingId?: string;
  source?: BlockSource;
}) {
  const readOnly = !!source && source !== 'local';
  const sourceLabel =
    source && source !== 'local' ? SOURCE_LABEL[source] : null;
  const [date, setDate] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<BlockKind>('write');
  const [customLabel, setCustomLabel] = useState('');
  const [attendees, setAttendees] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? '');
    setStart(initial?.start ?? '09:00');
    setEnd(initial?.end ?? '10:00');
    setEndDate(initial?.endDate ?? '');
    setTitle(initial?.title ?? '');
    const initialKind = initial?.kind ?? 'write';
    setKind(initialKind);
    setCustomLabel(initial?.customLabel ?? '');
    setAttendees((initial?.attendees ?? []).join(', '));
    setError(null);
    setConfirmDelete(false);
  }, [open, initial]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  if (!open) return null;

  const submit = async () => {
    if (busy || readOnly) return;
    const t = title.trim();
    if (!t) {
      setError('제목을 입력하세요');
      return;
    }
    if (!date || !start || !end) {
      setError('날짜·시작·끝을 입력하세요');
      return;
    }
    const ed = endDate.trim();
    if (ed && ed < date) {
      setError('끝 날짜가 시작 날짜보다 빠를 수 없습니다');
      return;
    }
    const sameDay = !ed || ed === date;
    const isAllDay = start === '00:00' && end === '00:00';
    if (sameDay && !isAllDay && start >= end) {
      setError('시작 시간이 끝보다 늦을 수 없습니다');
      return;
    }
    const finalKind = kind === 'custom' ? customLabel.trim().toLowerCase() : kind;
    if (kind === 'custom' && !customLabel.trim()) {
      setError('직접 입력한 종류 이름을 적어주세요');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        date,
        start,
        end,
        endDate: ed && ed !== date ? ed : undefined,
        title: t,
        kind: finalKind,
        customLabel: kind === 'custom' ? customLabel.trim() : undefined,
        attendees: parseAttendees(attendees),
      });
      onClose();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete || busy || readOnly) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await onDelete();
      setConfirmDelete(false);
      onClose();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(420px, 100%)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '16px 18px 12px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
          }}
        >
          <Eyebrow>
            {readOnly ? '외부 캘린더 — 읽기 전용' : editingId ? '블록 편집' : '블록 추가'}
          </Eyebrow>
          <h2
            style={{
              margin: '4px 0 0',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {readOnly ? title || '(제목 없음)' : '시간대를 정하고 무엇을 할지 적기'}
          </h2>
          {readOnly && sourceLabel && (
            <Mono
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 10.5,
                color: 'var(--ink-mute)',
                letterSpacing: '0.04em',
              }}
            >
              출처 · {sourceLabel}
            </Mono>
          )}
        </header>
        <div
          style={{
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Field label="제목">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!readOnly}
              placeholder="예: 글쓰기 — 토큰 계층"
              readOnly={readOnly}
              sm
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="시작 날짜">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                readOnly={readOnly}
                sm
              />
            </Field>
            <Field label="끝 날짜 (선택)">
              <Input
                type="date"
                value={endDate || date}
                onChange={(e) => setEndDate(e.target.value === date ? '' : e.target.value)}
                min={date || undefined}
                readOnly={readOnly}
                sm
              />
            </Field>
            <Field label="시작 시간">
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                step={300}
                readOnly={readOnly}
                sm
              />
            </Field>
            <Field label="끝 시간">
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                step={300}
                readOnly={readOnly}
                sm
              />
            </Field>
          </div>
          <Field label="종류">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  disabled={readOnly}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid transparent',
                    background:
                      kind === k.id ? 'var(--ink)' : 'var(--bg-soft)',
                    color: kind === k.id ? 'var(--on-accent)' : 'var(--ink-soft)',
                    fontSize: 11.5,
                    cursor: readOnly ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: readOnly && kind !== k.id ? 0.5 : 1,
                  }}
                >
                  {k.label}
                </button>
              ))}
              <button
                onClick={() => setKind('custom')}
                disabled={readOnly}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px dashed var(--line)',
                  background: kind === 'custom' ? 'var(--ink)' : 'transparent',
                  color: kind === 'custom' ? 'var(--on-accent)' : 'var(--ink-soft)',
                  fontSize: 11.5,
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: readOnly && kind !== 'custom' ? 0.5 : 1,
                }}
              >
                + 직접
              </button>
            </div>
          </Field>
          {kind === 'custom' && (
            <Field label="직접 입력한 종류 이름">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="예: 회고, 산책, 명상…"
                readOnly={readOnly}
                sm
              />
            </Field>
          )}
          <Field label="참석자 (쉼표로 구분, 선택)">
            <Input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="@지영, @팀"
              readOnly={readOnly}
              sm
            />
          </Field>
          {error && (
            <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>
          )}
        </div>
        <footer
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {readOnly ? (
            <>
              <Mono
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-mute)',
                  marginRight: 'auto',
                  letterSpacing: '0.04em',
                }}
              >
                외부 캘린더에서 동기화된 일정 — 편집은 원본 캘린더에서
              </Mono>
              <Button sm onClick={onClose}>
                닫기
              </Button>
            </>
          ) : (
            <>
              {onDelete && editingId && (
                <Button
                  sm
                  danger
                  onClick={remove}
                  disabled={busy}
                  style={{ marginRight: 'auto' }}
                >
                  {confirmDelete ? '한 번 더 눌러 삭제' : '삭제'}
                </Button>
              )}
              <Button sm ghost onClick={onClose} disabled={busy}>
                취소
              </Button>
              <Button sm onClick={submit} disabled={busy}>
                {editingId ? '저장' : '추가'}
              </Button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function parseAttendees(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export function blockToDraft(b: Block): AddBlockDraft {
  const isKnown = KINDS.some((k) => k.id === b.kind);
  return {
    date: b.date,
    start: b.start,
    end: b.end,
    endDate: b.endDate,
    title: b.title,
    kind: isKnown ? b.kind : 'custom',
    customLabel: isKnown ? b.customLabel : (b.customLabel ?? b.kind),
    attendees: b.attendees,
  };
}
