import { useEffect, useState } from 'react';
import type { Block, BlockKind } from '@vallista/content-core';
import { Button, Eyebrow, Mono } from '../../components/atoms/Atoms';

const KINDS: { id: BlockKind; label: string }[] = [
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
  title: string;
  kind: BlockKind;
  attendees: string[];
}

export function AddBlockDialog({
  open,
  initial,
  onSubmit,
  onClose,
  onDelete,
  editingId,
}: {
  open: boolean;
  initial: Partial<AddBlockDraft> | null;
  onSubmit: (draft: AddBlockDraft) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  editingId?: string;
}) {
  const [date, setDate] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<BlockKind>('write');
  const [attendees, setAttendees] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? '');
    setStart(initial?.start ?? '09:00');
    setEnd(initial?.end ?? '10:00');
    setTitle(initial?.title ?? '');
    setKind(initial?.kind ?? 'write');
    setAttendees((initial?.attendees ?? []).join(', '));
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  const submit = async () => {
    if (busy) return;
    const t = title.trim();
    if (!t) {
      setError('제목을 입력하세요');
      return;
    }
    if (!date || !start || !end) {
      setError('날짜·시작·끝을 입력하세요');
      return;
    }
    if (start >= end) {
      setError('시작 시간이 끝보다 늦을 수 없습니다');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        date,
        start,
        end,
        title: t,
        kind,
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
    if (!onDelete || busy) return;
    if (!confirm('이 블록을 삭제할까요?')) return;
    setBusy(true);
    try {
      await onDelete();
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
          <Eyebrow>{editingId ? '블록 편집' : '블록 추가'}</Eyebrow>
          <h2
            style={{
              margin: '4px 0 0',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            시간대를 정하고 무엇을 할지 적기
          </h2>
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
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="예: 글쓰기 — 토큰 계층"
              style={inputStyle}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="날짜">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="시작">
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                step={300}
                style={inputStyle}
              />
            </Field>
            <Field label="끝">
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                step={300}
                style={inputStyle}
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
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid transparent',
                    background:
                      kind === k.id ? 'var(--ink)' : 'var(--bg-soft)',
                    color: kind === k.id ? 'var(--on-accent)' : 'var(--ink-soft)',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="참석자 (쉼표로 구분, 선택)">
            <input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="@지영, @팀"
              style={inputStyle}
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
          {onDelete && editingId && (
            <Button sm danger onClick={remove} style={{ marginRight: 'auto' }}>
              삭제
            </Button>
          )}
          <Button sm ghost onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button sm onClick={submit} disabled={busy}>
            {editingId ? '저장' : '추가'}
          </Button>
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

const inputStyle: React.CSSProperties = {
  padding: '6px 9px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg-input)',
  color: 'var(--ink)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
};

function parseAttendees(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export function blockToDraft(b: Block): AddBlockDraft {
  return {
    date: b.date,
    start: b.start,
    end: b.end,
    title: b.title,
    kind: b.kind,
    attendees: b.attendees,
  };
}
