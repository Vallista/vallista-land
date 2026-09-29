import { useEffect, useState } from 'react';
import type { Block, BlockKind, BlockSource } from '@vallista/content-core';
import { Button, Checkbox, Input, Mono, Textarea } from '../../components/atoms/Atoms';
import { DialogLayout } from '../../components/DialogLayout';
import { BlockInfoView } from './BlockInfoView';
import { EventNotesPanel } from './EventNotesPanel';
import { LabelPicker } from '../../components/LabelPicker';
import { eventNoteKeysFromBlock } from '../../lib/tauri';

const SOURCE_LABEL: Record<Exclude<BlockSource, 'local'>, string> = {
  gcal: 'Google · iCal 구독',
  applecal: 'macOS 캘린더',
};

export interface AddBlockDraft {
  date: string;
  start: string;
  end: string;
  endDate?: string;
  title: string;
  kind: BlockKind;
  customLabel?: string;
  attendees: string[];
  actualStart?: string | null;
  actualEnd?: string | null;
  done?: boolean;
  notes?: string;
  color?: string;
  tags?: string[];
}

export function AddBlockDialog({
  open,
  initial,
  onSubmit,
  onClose,
  onDelete,
  excludedFromStats,
  onToggleExcludeFromStats,
  editingId,
  source,
  block,
}: {
  open: boolean;
  initial: Partial<AddBlockDraft> | null;
  onSubmit: (draft: AddBlockDraft) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  excludedFromStats?: boolean;
  onToggleExcludeFromStats?: () => void;
  editingId?: string;
  source?: BlockSource;
  block?: Block;
}) {
  const isExternal = !!source && source !== 'local';
  const sourceLabel = isExternal ? SOURCE_LABEL[source] : null;

  const [date, setDate] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<BlockKind>('write');
  const [attendees, setAttendees] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const isUnscheduled = initial?.start === '' && initial?.end === '';
    setNoTime(isUnscheduled);
    setDate(initial?.date ?? '');
    setStart(isUnscheduled ? '09:00' : (initial?.start ?? '09:00'));
    setEnd(isUnscheduled ? '10:00' : (initial?.end ?? '10:00'));
    setEndDate(initial?.endDate ?? '');
    setTitle(initial?.title ?? '');
    setKind(initial?.kind ?? 'write');
    setAttendees((initial?.attendees ?? []).join(', '));
    setActualStart(initial?.actualStart ?? '');
    setActualEnd(initial?.actualEnd ?? '');
    setDone(initial?.done ?? false);
    setNotes(initial?.notes ?? '');
    setColor(initial?.color ?? '');
    setTagsInput((initial?.tags ?? []).join(', '));
    setError(null);
    setConfirmDelete(false);
  }, [open, initial]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  if (!open) return null;

  const blockNoteKeys = block ? eventNoteKeysFromBlock(block) : null;

  const toggleDone = (next: boolean) => {
    setDone(next);
    if (next && !noTime) {
      if (!actualStart.trim()) setActualStart(start);
      if (!actualEnd.trim()) setActualEnd(end);
    }
  };

  const submit = async () => {
    if (busy) return;
    const t = title.trim();
    if (!t) {
      setError('제목을 입력하세요');
      return;
    }
    if (!date) {
      setError('날짜를 입력하세요');
      return;
    }
    const ed = endDate.trim();
    if (ed && ed < date) {
      setError('끝 날짜가 시작 날짜보다 빠를 수 없습니다');
      return;
    }
    if (!noTime) {
      if (!start || !end) {
        setError('시작·끝 시간을 입력하세요');
        return;
      }
      const sameDay = !ed || ed === date;
      const isAllDay = start === '00:00' && end === '00:00';
      if (sameDay && !isAllDay && start >= end) {
        setError('시작 시간이 끝보다 늦을 수 없습니다');
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        date,
        start: noTime ? '' : start,
        end: noTime ? '' : end,
        endDate: ed && ed !== date ? ed : undefined,
        title: t,
        kind,
        customLabel: undefined,
        attendees: parseAttendees(attendees),
        actualStart: actualStart.trim() ? actualStart.trim() : null,
        actualEnd: actualEnd.trim() ? actualEnd.trim() : null,
        done,
        notes: notes.trim() || undefined,
        color: color || undefined,
        tags: parseTags(tagsInput),
      });
      onClose();
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete || busy || isExternal) return;
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
    <DialogLayout
      open={open}
      onClose={onClose}
      eyebrow={isExternal ? '외부 캘린더 — 분류·진행 사이드카' : editingId ? '블록 편집' : '블록 추가'}
      title={isExternal ? title || '(제목 없음)' : noTime ? '날짜를 정하고 무엇을 할지 적기' : '시간대를 정하고 무엇을 할지 적기'}
      headerRight={
        (onToggleExcludeFromStats || sourceLabel) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onToggleExcludeFromStats && (
              <button
                type="button"
                onClick={onToggleExcludeFromStats}
                title="통계·합계에서 이 일정을 제외하거나 포함합니다"
                style={{
                  border: excludedFromStats
                    ? '1px solid var(--line-strong)'
                    : '1px dashed var(--line-strong)',
                  background: excludedFromStats ? 'var(--bg-soft)' : 'transparent',
                  color: excludedFromStats ? 'var(--ink-mute)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  padding: '3px 8px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: 'inherit',
                  letterSpacing: 0,
                  lineHeight: 1.5,
                  whiteSpace: 'nowrap',
                  textDecoration: excludedFromStats ? 'line-through' : 'none',
                }}
              >
                통계 제외
              </button>
            )}
            {sourceLabel && (
              <Mono
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-mute)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {sourceLabel}
              </Mono>
            )}
          </div>
        ) : undefined
      }
      leftPane={isExternal && block ? (
        <>
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
            <Mono
              style={{
                fontSize: 10,
                color: 'var(--ink-mute)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              분류·진행 (사이드카)
            </Mono>
            <Field label="종류 · 색상">
              <LabelPicker
                kind={kind}
                color={color}
                onChange={(k, c) => { setKind(k as BlockKind); setColor(c); }}
              />
            </Field>
            <Field label="태그 (선택)">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="쉼표로 구분  예: 업무, 미팅, 개인"
                sm
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="실제 시작 (선택)">
                <Input
                  type="time"
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
              <Field label="실제 끝 (선택)">
                <Input
                  type="time"
                  value={actualEnd}
                  onChange={(e) => setActualEnd(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
            </div>
            {!excludedFromStats && (
              <Checkbox checked={done} onChange={toggleDone}>완료</Checkbox>
            )}
          </div>

          <BlockInfoView
            block={block}
            showFooterNote={false}
            excludedFromStats={excludedFromStats}
          />

          {error && (
            <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>
          )}
        </>
      ) : (
        <>
          <Field label="제목" lock={isExternal}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!isExternal}
              placeholder="예: 글쓰기 — 토큰 계층"
              readOnly={isExternal}
              sm
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="시작 날짜" lock={isExternal}>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                readOnly={isExternal}
                sm
              />
            </Field>
            <Field label="끝 날짜 (선택)" lock={isExternal}>
              <Input
                type="date"
                value={endDate || date}
                onChange={(e) => setEndDate(e.target.value === date ? '' : e.target.value)}
                min={date || undefined}
                readOnly={isExternal}
                sm
              />
            </Field>
          </div>
          {!isExternal && (
            <Checkbox
              checked={noTime}
              onChange={(v) => {
                setNoTime(v);
                if (!v && !start) setStart('09:00');
                if (!v && !end) setEnd('10:00');
              }}
            >
              시간 미정 (날짜만 지정)
            </Checkbox>
          )}
          {!noTime && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="시작 시간" lock={isExternal}>
                <Input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  step={300}
                  readOnly={isExternal}
                  sm
                />
              </Field>
              <Field label="끝 시간" lock={isExternal}>
                <Input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  step={300}
                  readOnly={isExternal}
                  sm
                />
              </Field>
            </div>
          )}
          <Field label="종류 · 색상">
            <LabelPicker
              kind={kind}
              color={color}
              onChange={(k, c) => { setKind(k as BlockKind); setColor(c); }}
            />
          </Field>
          <Field label="참석자 (쉼표로 구분, 선택)" lock={isExternal}>
            <Input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="@지영, @팀"
              readOnly={isExternal}
              sm
            />
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
                실제 진행
              </Mono>
              <span style={{ flex: 1 }} />
              <Mono
                style={{
                  fontSize: 10,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.04em',
                }}
              >
                비우면 예정 시간 그대로
              </Mono>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="실제 시작 (선택)">
                <Input
                  type="time"
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
              <Field label="실제 끝 (선택)">
                <Input
                  type="time"
                  value={actualEnd}
                  onChange={(e) => setActualEnd(e.target.value)}
                  step={300}
                  sm
                />
              </Field>
            </div>
            {!excludedFromStats && (
              <Checkbox checked={done} onChange={toggleDone}>완료</Checkbox>
            )}
          </div>
          {error && (
            <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>
          )}
        </>
      )}
      rightPane={isExternal && block && blockNoteKeys ? (
        <EventNotesPanel
          eventKey={blockNoteKeys.eventKey}
          seriesKey={blockNoteKeys.seriesKey}
          titleSnapshot={block.title}
          dateSnapshot={block.date}
        />
      ) : block && blockNoteKeys ? (
        <EventNotesPanel
          eventKey={blockNoteKeys.eventKey}
          seriesKey={blockNoteKeys.seriesKey}
          titleSnapshot={block.title}
          dateSnapshot={block.date}
        />
      ) : (
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
            placeholder="블록에 대한 메모를 미리 적어두세요"
            style={{
              flex: 1,
              fontSize: 12.5,
              lineHeight: 1.65,
              resize: 'none',
              minHeight: 120,
            }}
          />
        </div>
      )}
      footerLeft={isExternal ? (
        <Mono
          style={{
            fontSize: 10.5,
            color: 'var(--ink-mute)',
            letterSpacing: '0.04em',
          }}
        >
          제목·시간은 원본 캘린더에서
        </Mono>
      ) : (!isExternal && onDelete && editingId) ? (
        <Button sm danger onClick={remove} disabled={busy}>
          {confirmDelete ? '한 번 더 눌러 삭제' : '삭제'}
        </Button>
      ) : undefined}
      footerRight={
        <>
          <Button sm ghost onClick={onClose} disabled={busy}>취소</Button>
          <Button sm onClick={submit} disabled={busy}>
            {editingId ? '저장' : '추가'}
          </Button>
        </>
      }
    />
  );
}

function Field({
  label,
  lock,
  children,
}: {
  label: string;
  lock?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 10.5,
          color: lock ? 'var(--ink-faint)' : 'var(--ink-mute)',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {label}
        {lock && (
          <span style={{ fontSize: 9, color: 'var(--ink-faint)' }}>· 원본</span>
        )}
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

function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim().replace(/^#/, ''))
    .filter((x) => x.length > 0);
}

export function blockToDraft(b: Block): AddBlockDraft {
  return {
    date: b.date,
    start: b.start,
    end: b.end,
    endDate: b.endDate,
    title: b.title,
    kind: b.kind,
    customLabel: b.customLabel,
    attendees: b.attendees,
    actualStart: b.actualStart ?? null,
    actualEnd: b.actualEnd ?? null,
    done: b.done,
    notes: b.notes,
    color: b.color,
    tags: b.tags,
  };
}
