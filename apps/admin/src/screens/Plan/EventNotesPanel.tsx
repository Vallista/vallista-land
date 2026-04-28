import { useEffect, useMemo, useState } from 'react';
import type { Block } from '@vallista/content-core';
import { Button, Mono, Textarea } from '../../components/atoms/Atoms';
import {
  deleteEventNote,
  eventNoteKeysFromBlock,
  listEventNotesByEvent,
  listEventNotesBySeries,
  upsertEventNote,
  type EventNote,
} from '../../lib/tauri';

interface Props {
  block: Block;
  occurrenceDate?: string;
}

export function EventNotesPanel({ block, occurrenceDate }: Props) {
  const { eventKey, seriesKey } = useMemo(
    () => eventNoteKeysFromBlock(block, occurrenceDate),
    [block, occurrenceDate],
  );
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setEditingId(null);
    setShowPrev(false);
    (async () => {
      try {
        const here = await listEventNotesByEvent(eventKey);
        if (!alive) return;
        setCurrent(here.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
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

  const occurrence = occurrenceDate ?? block.date;

  const addNote = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await upsertEventNote({
        eventKey,
        seriesKey,
        eventTitleSnapshot: block.title || '(제목 없음)',
        eventDateSnapshot: occurrence,
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
        eventTitleSnapshot: target?.eventTitleSnapshot ?? block.title,
        eventDateSnapshot: target?.eventDateSnapshot ?? occurrence,
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
        gap: 10,
        padding: '12px 14px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
      }}
    >
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
