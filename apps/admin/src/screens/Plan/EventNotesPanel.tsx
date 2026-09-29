import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Mono, Textarea } from '../../components/atoms/Atoms';
import {
  addEventSubtask,
  deleteEventNote,
  deleteEventSubtask,
  listEventNotesByEvent,
  listEventNotesBySeries,
  listEventSubtasks,
  toggleEventSubtask,
  upsertEventNote,
  type EventNote,
  type EventSubtask,
} from '../../lib/tauri';

interface Props {
  eventKey: string;
  seriesKey: string;
  titleSnapshot: string;
  dateSnapshot: string;
}

export function EventNotesPanel({ eventKey, seriesKey, titleSnapshot, dateSnapshot }: Props) {
  const isSeries = eventKey !== seriesKey;

  const [current, setCurrent] = useState<EventNote[]>([]);
  const [previous, setPrevious] = useState<EventNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPrev, setShowPrev] = useState(false);

  const [subtasks, setSubtasks] = useState<EventSubtask[]>([]);
  const [subDraft, setSubDraft] = useState('');
  const [subBusy, setSubBusy] = useState(false);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setEditingId(null);
    setShowPrev(false);
    (async () => {
      try {
        const [here, subs] = await Promise.all([
          listEventNotesByEvent(eventKey),
          listEventSubtasks(eventKey),
        ]);
        if (!alive) return;
        setCurrent(here.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        setSubtasks(subs);
        if (isSeries) {
          const series = await listEventNotesBySeries(seriesKey);
          if (!alive) return;
          setPrevious(series.filter((n) => n.eventKey !== eventKey));
        } else {
          setPrevious([]);
        }
      } catch (e: unknown) {
        if (alive) setError(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [eventKey, seriesKey, isSeries]);

  const reload = async () => {
    const here = await listEventNotesByEvent(eventKey);
    setCurrent(here.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    if (isSeries) {
      const series = await listEventNotesBySeries(seriesKey);
      setPrevious(series.filter((n) => n.eventKey !== eventKey));
    }
  };

  const notifySubtaskChanged = () =>
    window.dispatchEvent(new CustomEvent('bento:subtasks-changed'));

  const addSub = async () => {
    const title = subDraft.trim();
    if (!title || subBusy) return;
    setSubBusy(true);
    try {
      const sub = await addEventSubtask({
        eventKey,
        seriesKey,
        eventTitleSnapshot: titleSnapshot || '(제목 없음)',
        eventDateSnapshot: dateSnapshot,
        title,
      });
      setSubtasks((prev) => [...prev, sub]);
      setSubDraft('');
      notifySubtaskChanged();
      subInputRef.current?.focus();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSubBusy(false);
    }
  };

  const toggleSub = async (id: string, done: boolean) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done } : s)));
    try {
      await toggleEventSubtask(eventKey, id, done);
      notifySubtaskChanged();
    } catch (e: unknown) {
      setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !done } : s)));
      setError(String(e));
    }
  };

  const removeSub = async (id: string) => {
    if (subBusy) return;
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteEventSubtask(eventKey, id);
      notifySubtaskChanged();
    } catch (e: unknown) {
      const subs = await listEventSubtasks(eventKey);
      setSubtasks(subs);
      setError(String(e));
    }
  };

  const addNote = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await upsertEventNote({
        eventKey,
        seriesKey,
        eventTitleSnapshot: titleSnapshot || '(제목 없음)',
        eventDateSnapshot: dateSnapshot,
        body,
      });
      setDraft('');
      await reload();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (note: EventNote) => {
    setEditingId(note.id);
    setEditingBody(note.body);
  };

  const saveEdit = async () => {
    if (!editingId || busy) return;
    const body = editingBody.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const target = current.find((n) => n.id === editingId);
      await upsertEventNote({
        id: editingId,
        eventKey: target?.eventKey ?? eventKey,
        seriesKey: target?.seriesKey ?? seriesKey,
        eventTitleSnapshot: target?.eventTitleSnapshot ?? titleSnapshot,
        eventDateSnapshot: target?.eventDateSnapshot ?? dateSnapshot,
        body,
      });
      setEditingId(null);
      setEditingBody('');
      await reload();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingBody('');
  };

  const removeNote = async (id: string) => {
    if (busy) return;
    if (!window.confirm('이 메모를 삭제할까요?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEventNote(id);
      await reload();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap)',
        padding: 'var(--card-pad)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mono
            style={{
              fontSize: 9.5,
              color: 'var(--ink-mute)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            체크리스트
          </Mono>
          {subtasks.length > 0 && (
            <Mono style={{ fontSize: 9.5, color: 'var(--ink-soft)' }}>
              · {subtasks.filter((s) => s.done).length}/{subtasks.length}
            </Mono>
          )}
        </div>
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Checkbox
              checked={sub.done}
              onChange={(v) => toggleSub(sub.id, v)}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                color: sub.done ? 'var(--ink-mute)' : 'var(--ink)',
                textDecoration: sub.done ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}
            >
              {sub.title}
            </span>
            <button
              onClick={() => removeSub(sub.id)}
              disabled={subBusy}
              style={btnLink('var(--ink-mute)')}
            >
              ×
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={subInputRef}
            type="text"
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSub();
            }}
            placeholder="항목 추가 후 Enter"
            disabled={subBusy}
            style={{
              flex: 1,
              fontSize: 11.5,
              padding: '4px 6px',
              borderRadius: 4,
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <Button sm onClick={addSub} disabled={subBusy || subDraft.trim().length === 0}>
            추가
          </Button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono
          style={{
            fontSize: 9.5,
            color: 'var(--ink-mute)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          내 메모
        </Mono>
        {!loading && current.length > 0 && (
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-soft)' }}>
            · {current.length}건
          </Mono>
        )}
        {isSeries && previous.length > 0 && (
          <button
            onClick={() => setShowPrev((v) => !v)}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            {showPrev ? '이전 메모 숨기기' : `이전 회차 메모 ${previous.length}건`}
          </button>
        )}
      </div>

      {loading ? (
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>
      ) : (
        <>
          {current.length === 0 && (
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
              아직 메모가 없습니다.
            </Mono>
          )}
          {current.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editingBody={editingBody}
              setEditingBody={setEditingBody}
              onEdit={() => startEdit(note)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onDelete={() => removeNote(note.id)}
              busy={busy}
            />
          ))}
        </>
      )}

      {showPrev && previous.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingTop: 8,
            borderTop: '1px dashed var(--line)',
          }}
        >
          <Mono
            style={{
              fontSize: 9,
              color: 'var(--ink-mute)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            같은 일정 · 이전 회차
          </Mono>
          {previous.map((note) => (
            <PreviousNoteRow key={note.id} note={note} />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingTop: 8,
          borderTop: '1px solid var(--line)',
        }}
      >
        <Textarea
          sm
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="이 일정에 메모를 남기기"
          rows={2}
          disabled={busy}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button sm onClick={addNote} disabled={busy || draft.trim().length === 0}>
            메모 추가
          </Button>
        </div>
      </div>

      {error && (
        <Mono style={{ fontSize: 10.5, color: 'var(--err)' }}>{error}</Mono>
      )}
    </div>
  );
}

function NoteRow({
  note,
  isEditing,
  editingBody,
  setEditingBody,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  busy,
}: {
  note: EventNote;
  isEditing: boolean;
  editingBody: string;
  setEditingBody: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {isEditing ? (
        <>
          <Textarea
            sm
            value={editingBody}
            onChange={(e) => setEditingBody(e.target.value)}
            rows={3}
            disabled={busy}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button sm ghost onClick={onCancel} disabled={busy}>
              취소
            </Button>
            <Button sm onClick={onSave} disabled={busy || editingBody.trim().length === 0}>
              저장
            </Button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {note.body}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 10,
              color: 'var(--ink-mute)',
            }}
          >
            <Mono style={{ fontSize: 9.5 }}>{formatTime(note.updatedAt)}</Mono>
            <button
              onClick={onEdit}
              disabled={busy}
              style={btnLink('var(--ink-soft)')}
            >
              편집
            </button>
            <button
              onClick={onDelete}
              disabled={busy}
              style={btnLink('var(--err)')}
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PreviousNoteRow({ note }: { note: EventNote }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: 4,
        background: 'var(--bg)',
        border: '1px solid var(--line-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Mono style={{ fontSize: 9, color: 'var(--ink-mute)' }}>
        {note.eventDateSnapshot}
      </Mono>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--ink-soft)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.45,
        }}
      >
        {note.body}
      </div>
    </div>
  );
}

function btnLink(color: string): React.CSSProperties {
  return {
    border: 'none',
    background: 'transparent',
    color,
    cursor: 'pointer',
    padding: 0,
    fontSize: 10,
    fontFamily: 'inherit',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  };
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const t = iso.replace('T', ' ').replace('Z', '');
  return t.length >= 16 ? t.slice(0, 16) : t;
}
