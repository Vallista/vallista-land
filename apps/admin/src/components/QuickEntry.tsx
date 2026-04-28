import { useEffect, useRef, useState } from 'react';
import { Input, Mono, Textarea } from './atoms/Atoms';
import { TagInput } from './TagInput';
import { TimeSelect } from './TimeSelect';
import { EstSelect } from './EstSelect';
import { addTask } from '../lib/tauri';
import { notifyTagsChanged } from '../lib/tags';
import {
  LABEL_PALETTE,
  TYPE_META,
  loadThoughts,
  newThought,
  saveThoughts,
  type ThoughtLabel,
  type ThoughtType,
} from '../lib/thoughts';

const EST_OPTIONS: { min: number; label: string }[] = [
  { min: 15, label: '15m' },
  { min: 30, label: '30m' },
  { min: 60, label: '1h' },
  { min: 120, label: '2h' },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function makeIso(date: string, time?: string | null): string {
  if (!date) return '';
  if (!time) return date;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m || !m[1] || !m[2]) return date;
  return `${date}T${pad2(Number(m[1]))}:${m[2]}:00`;
}

export type QuickKind = ThoughtType | 'task';

export const KIND_ORDER: QuickKind[] = ['thought', 'glean', 'blog', 'task'];

export const KIND_META: Record<QuickKind, { label: string; glyph: string; tone: string; placeholder: string }> = {
  thought: {
    label: TYPE_META.thought.label,
    glyph: TYPE_META.thought.glyph,
    tone: 'var(--ink-mute)',
    placeholder: '머릿속에 떠오른 한 줄…',
  },
  glean: {
    label: TYPE_META.glean.label,
    glyph: TYPE_META.glean.glyph,
    tone: 'var(--blue)',
    placeholder: '나중에 다시 볼 링크나 문구',
  },
  blog: {
    label: TYPE_META.blog.label,
    glyph: TYPE_META.blog.glyph,
    tone: 'var(--hl-violet)',
    placeholder: '블로그로 발전시킬 씨앗 한 문장',
  },
  task: {
    label: '할 일',
    glyph: '▦',
    tone: 'var(--warn)',
    placeholder: '무엇을 해야 하나요?',
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialKind?: QuickKind;
  popup?: boolean;
  blogEnabled?: boolean;
}

export function QuickEntry({
  open,
  onClose,
  initialKind = 'thought',
  popup = false,
  blogEnabled = true,
}: Props) {
  const visibleKinds: QuickKind[] = blogEnabled
    ? KIND_ORDER
    : KIND_ORDER.filter((k) => k !== 'blog');
  const safeInitial = visibleKinds.includes(initialKind) ? initialKind : 'thought';
  const [kind, setKind] = useState<QuickKind>(safeInitial);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [label, setLabel] = useState<ThoughtLabel | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estMin, setEstMin] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bodyOpen, setBodyOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(visibleKinds.includes(initialKind) ? initialKind : 'thought');
    setTitle('');
    setBody('');
    setTags([]);
    setLabel(undefined);
    setStartDate('');
    setStartTime('');
    setDueDate('');
    setDueTime('');
    setEstMin(null);
    setError(null);
    setBodyOpen(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open, initialKind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const next = visibleKinds[Number(e.key) - 1];
        if (next) setKind(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = async () => {
    const text = title.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === 'task') {
        const startAt = startDate
          ? makeIso(startDate, startTime)
          : startTime && /^\d{1,2}:\d{2}$/.test(startTime)
            ? startTime
            : undefined;
        const due = dueDate ? makeIso(dueDate, dueTime) : undefined;
        await addTask({
          id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: text,
          due: due || undefined,
          estMin: estMin ?? undefined,
          startAt: startAt || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
        notifyTagsChanged('tasks');
      } else {
        const item = newThought({
          type: kind,
          title: text,
          body: body.trim() || undefined,
          label,
          tags,
        });
        const next = [item, ...loadThoughts()];
        saveThoughts(next);
        window.dispatchEvent(new CustomEvent('bento:thoughts-changed'));
      }
      onClose();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  const meta = KIND_META[kind];
  const isTask = kind === 'task';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={popup ? undefined : onClose}
      data-tauri-drag-region={popup ? '' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: popup ? 'transparent' : 'rgba(15,18,22,0.42)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: popup ? 24 : '14vh',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: popup ? 'min(560px, calc(100vw - 80px))' : 'min(560px, 92vw)',
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          boxShadow: popup
            ? '0 12px 40px rgba(0,0,0,0.28)'
            : '0 18px 50px rgba(0,0,0,0.32)',
          padding: popup ? '10px 12px 12px' : 14,
          display: 'flex',
          flexDirection: 'column',
          gap: popup ? 8 : 10,
        }}
      >
        {popup && (
          <div
            data-tauri-drag-region
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 12,
              cursor: 'grab',
              zIndex: 1,
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {visibleKinds.map((k, i) => {
            const m = KIND_META[k];
            const active = kind === k;
            return (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: '1px solid transparent',
                  background: active ? 'var(--bg-shade)' : 'transparent',
                  color: active ? m.tone : 'var(--ink-mute)',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                title={`⌘${i + 1}`}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{m.glyph}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            ⌘1–4 전환 · esc 닫기 · ↵ 등록
          </Mono>
        </div>

        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={meta.placeholder}
          style={{
            padding: popup ? '7px 10px' : '10px 12px',
            fontSize: popup ? 13.5 : 15,
            borderRadius: popup ? 6 : 8,
          }}
        />

        {!isTask && bodyOpen && (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="설명 · 메모 (선택)"
            rows={3}
            style={{
              lineHeight: 1.55,
            }}
          />
        )}

        {!isTask && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>라벨</Mono>
            <button
              onClick={() => setLabel(undefined)}
              title="라벨 없음"
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                border: !label ? '2px solid var(--ink)' : '1px dashed var(--line-strong)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
            {(Object.keys(LABEL_PALETTE) as ThoughtLabel[]).map((c) => {
              const p = LABEL_PALETTE[c];
              const active = label === c;
              return (
                <button
                  key={c}
                  onClick={() => setLabel(c)}
                  title={p.name}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    border: active ? `2px solid ${p.fg}` : '1px solid transparent',
                    background: p.bg,
                    cursor: 'pointer',
                  }}
                />
              );
            })}
            <span style={{ flex: 1 }} />
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <TagInput value={tags} onChange={setTags} size="sm" placeholder="태그" />
            </div>
          </div>
        )}

        {isTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <TaskDateTimeRow
              label="시작"
              date={startDate}
              time={startTime}
              onDateChange={setStartDate}
              onTimeChange={setStartTime}
            />
            <TaskDateTimeRow
              label="마감"
              date={dueDate}
              time={dueTime}
              onDateChange={setDueDate}
              onTimeChange={setDueTime}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
                est
              </Mono>
              {EST_OPTIONS.map((o) => {
                const sel = estMin === o.min;
                return (
                  <button
                    key={o.min}
                    onClick={() => setEstMin(sel ? null : o.min)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontFamily: 'inherit',
                      border: '1px solid var(--line)',
                      background: sel ? 'var(--ink)' : 'transparent',
                      color: sel ? 'var(--on-accent)' : 'var(--ink-soft)',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
              <div style={{ flex: 1, minWidth: 90 }}>
                <EstSelect value={estMin} onChange={setEstMin} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
                tags
              </Mono>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TagInput value={tags} onChange={setTags} size="sm" />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isTask && (
            <button
              onClick={() => setBodyOpen((v) => !v)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily: 'inherit',
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink-soft)',
                borderRadius: 5,
                cursor: 'pointer',
                lineHeight: 1.2,
              }}
            >
              {bodyOpen ? '본문 닫기' : '본문 열기'}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '5px 11px',
              border: '1px solid var(--line-strong)',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 12,
              borderRadius: 5,
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={busy || !title.trim()}
            style={{
              padding: '5px 13px',
              border: '1px solid var(--ink)',
              background: 'var(--ink)',
              color: 'var(--on-accent)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 5,
              cursor: busy ? 'wait' : 'pointer',
              opacity: !title.trim() ? 0.6 : 1,
              lineHeight: 1.2,
            }}
          >
            {busy ? '저장 중…' : '등록 ↵'}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '7px 10px',
              border: '1px solid var(--err-soft)',
              background: 'var(--err-soft)',
              color: 'var(--err)',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskDateTimeRow({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
        {label}
      </Mono>
      <Input
        sm
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          border: `1px ${date === '' ? 'dashed' : 'solid'} var(--line)`,
          color: date === '' ? 'var(--ink-mute)' : 'var(--ink)',
        }}
      />
      <div style={{ width: 96, flexShrink: 0 }}>
        <TimeSelect value={time} onChange={onTimeChange} title={`${label} 시간`} />
      </div>
    </div>
  );
}
