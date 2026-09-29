import { useEffect, useRef, useState } from 'react';
import { emit } from '@tauri-apps/api/event';
import CodeMirror from '@uiw/react-codemirror';
import { Button, Input, Mono, Textarea } from './atoms/Atoms';
import { TagInput } from './TagInput';
import { LabelPicker } from './LabelPicker';
import { addTask, upsertEventNote, startWindowDrag } from '../lib/tauri';
import { notifyTagsChanged } from '../lib/tags';
import { DialogLayout } from './DialogLayout';
import {
  LABEL_PALETTE,
  TYPE_META,
  loadThoughts,
  newThought,
  saveThoughts,
  type ThoughtLabel,
  type ThoughtType,
} from '../lib/thoughts';
import { mdExtensions, mdBasicSetup } from '../lib/mdEditorConfig';

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

export const KIND_ORDER: QuickKind[] = ['thought', 'task'];

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
    placeholder: '할 일 제목',
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialKind?: QuickKind;
  popup?: boolean;
  initialStartDate?: string;
}

export function QuickEntry({
  open,
  onClose,
  initialKind = 'thought',
  popup = false,
  initialStartDate,
}: Props) {
  const visibleKinds: QuickKind[] = KIND_ORDER;
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
  const [color, setColor] = useState('');
  const [taskKind, setTaskKind] = useState('write');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(visibleKinds.includes(initialKind) ? initialKind : 'thought');
    setTitle('');
    setBody('');
    setTags([]);
    setLabel(undefined);
    setStartDate(initialStartDate ?? '');
    setStartTime('');
    setDueDate('');
    setDueTime('');
    setEstMin(null);
    setColor('');
    setTaskKind('write');
    setNotes('');
    setError(null);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open, initialKind, initialStartDate]);

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
        const created = await addTask({
          id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: text,
          due: due || undefined,
          estMin: estMin ?? undefined,
          startAt: startAt || undefined,
          tags: tags.length > 0 ? tags : undefined,
          color: color || undefined,
          kind: taskKind,
          notes: notes.trim() || undefined,
        });
        if (notes.trim()) {
          await upsertEventNote({
            eventKey: `task:${created.id}`,
            seriesKey: `task:${created.id}`,
            eventTitleSnapshot: text,
            eventDateSnapshot: '',
            body: notes.trim(),
          }).catch(() => {});
        }
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
        void emit('bento:thoughts-changed');
      }
      onClose();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const meta = KIND_META[kind];
  const isTask = kind === 'task';

  return (
    <DialogLayout
      open={open}
      popup={popup}
      dragRegion={popup}
      onClose={onClose}
      eyebrow={isTask ? '할 일 추가' : meta.label}
      title={isTask ? '새 TODO 등록' : meta.placeholder}
      headerRight={
        <div style={{ display: 'flex', gap: 4 }} onMouseDown={popup ? startWindowDrag : undefined}>
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
        </div>
      }
      leftPane={
        isTask ? (
          <>
            <Field label="제목">
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
                placeholder="예: 주간 리뷰 작성"
                sm
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="시작 날짜 (선택)">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sm
                />
              </Field>
              <Field label="마감 날짜 (선택)">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={startDate || undefined}
                  sm
                />
              </Field>
              <Field label="시작 시간 (선택)">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
              <Field label="마감 시간 (선택)">
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
            </div>

            <Field label="라벨">
              <LabelPicker
                kind={taskKind}
                color={color}
                onChange={(k, c) => { setTaskKind(k); setColor(c); }}
              />
            </Field>

            <Field label="태그 (쉼표로 구분, 선택)">
              <TagInput value={tags} onChange={setTags} size="sm" placeholder="태그" />
            </Field>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '10px 12px',
                background: 'var(--bg-soft)',
                border: '1px dashed var(--line)',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mono
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-mute)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  예상 소요시간
                </Mono>
                <span style={{ flex: 1 }} />
                <Mono
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-faint)',
                    letterSpacing: '0.04em',
                  }}
                >
                  비우면 미정
                </Mono>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {EST_OPTIONS.map((o) => {
                  const sel = estMin === o.min;
                  return (
                    <button
                      key={o.min}
                      onClick={() => setEstMin(sel ? null : o.min)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: '1px solid transparent',
                        background: sel ? 'var(--ink)' : 'var(--bg)',
                        color: sel ? 'var(--on-accent)' : 'var(--ink-soft)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>
            )}
          </>
        ) : (
          <>
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
              sm
            />

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
          </>
        )
      }
      rightPane={
        isTask ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '4px 0',
            }}
          >
            <Mono style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--ink-mute)' }}>
              메모 (선택)
            </Mono>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="할 일에 대한 메모를 미리 적어두세요"
              style={{
                flex: 1,
                fontSize: 12.5,
                lineHeight: 1.65,
                resize: 'none',
                minHeight: 120,
              }}
            />
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CodeMirror
              value={body}
              onChange={setBody}
              extensions={mdExtensions}
              theme="none"
              placeholder="본문을 마크다운으로 쓰세요… (선택)"
              height="100%"
              basicSetup={mdBasicSetup}
              style={{ height: '100%', fontSize: 13, fontFamily: 'var(--font-sans)' }}
            />
          </div>
        )
      }
      footerLeft={undefined}
      footerRight={
        <>
          <Button sm ghost onClick={onClose} disabled={busy}>취소</Button>
          <Button sm onClick={submit} disabled={busy || !title.trim()}>
            {busy ? '…' : isTask ? '추가' : '등록 ↵'}
          </Button>
        </>
      }
    />
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
      <span
        style={{
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

