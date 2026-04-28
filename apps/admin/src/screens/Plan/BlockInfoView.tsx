import type { Block, KnownBlockKind } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import {
  EXTERNAL_COLOR,
  KIND_COLOR,
  KIND_LABEL,
  SOURCE_LABEL,
  dayOffset,
  isAllDayBlock,
  isLocal,
  spanDayCount,
} from './blockMeta';

interface Props {
  block: Block;
  dayDate?: string;
  segment?: { start: string; end: string; isMulti: boolean };
  showFooterNote?: boolean;
}

export function BlockInfoView({ block, dayDate, segment, showFooterNote = true }: Props) {
  const external = !isLocal(block);
  const allDay = isAllDayBlock(block);
  const c = external
    ? EXTERNAL_COLOR
    : (KIND_COLOR[block.kind as KnownBlockKind] ?? KIND_COLOR.life);
  const kindLabel =
    (KIND_LABEL as Record<string, string>)[block.kind] ??
    block.customLabel ??
    block.kind;
  const sourceLabel =
    block.source && block.source !== 'local' ? SOURCE_LABEL[block.source] : null;
  const totalDays = spanDayCount(block);
  const refDate = dayDate ?? block.date;
  const dayIndex = totalDays > 1 ? dayOffset(block.date, refDate) + 1 : 1;
  const timeText = allDay
    ? totalDays > 1
      ? `종일 · ${block.date} → ${block.endDate ?? block.date}`
      : '종일'
    : segment?.isMulti
      ? `${segment.start}–${segment.end === '24:00' ? '24:00' : segment.end} · ${block.start}–${block.end} (${dayIndex}/${totalDays})`
      : totalDays > 1
        ? `${block.date} ${block.start} → ${block.endDate ?? block.date} ${block.end}`
        : `${block.start} – ${block.end}`;

  const locationText = (block.location ?? '').trim();
  const notesText = (block.notes ?? '').trim();
  const calendarName = (block.calendarName ?? '').trim();
  const urlText = (block.url ?? '').trim();
  const recurring = block.recurring === true;
  const urlHost = (() => {
    if (!urlText) return '';
    try {
      return new URL(urlText).host;
    } catch {
      return urlText.length > 48 ? urlText.slice(0, 48) + '…' : urlText;
    }
  })();
  const fallbackLocation =
    !locationText && block.source === 'applecal' && block.attendees.length === 1
      ? block.attendees[0]?.trim() ?? ''
      : '';
  const showLocation = (locationText || fallbackLocation).length > 0;
  const showAttendees =
    block.attendees.length > 0 && !(fallbackLocation && block.attendees.length === 1);
  const showNotes = notesText.length > 0;
  const showUrl = urlHost.length > 0;

  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--bg)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.ink}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <Mono
        style={{
          fontSize: 9.5,
          color: c.ink,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {timeText}
      </Mono>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink)',
          lineHeight: 1.35,
          wordBreak: 'break-word',
          textDecoration: block.done ? 'line-through' : 'none',
          opacity: block.done ? 0.6 : 1,
        }}
      >
        {block.title || '(제목 없음)'}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <Mono
          style={{
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 999,
            background: c.bg,
            color: c.ink,
            border: `1px solid ${c.border}`,
            letterSpacing: '0.04em',
          }}
        >
          {kindLabel}
        </Mono>
        {sourceLabel && (
          <Mono
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'var(--bg-soft)',
              color: 'var(--ink-mute)',
              border: '1px dashed var(--line)',
              letterSpacing: '0.04em',
            }}
          >
            {sourceLabel}
          </Mono>
        )}
        {calendarName && (
          <Mono
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'var(--bg-soft)',
              color: 'var(--ink-soft)',
              border: '1px solid var(--line)',
              letterSpacing: '0.04em',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={calendarName}
          >
            {calendarName}
          </Mono>
        )}
        {totalDays > 1 && !allDay && segment?.isMulti && (
          <Mono
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'var(--bg-soft)',
              color: 'var(--ink-mute)',
              border: '1px solid var(--line)',
              letterSpacing: '0.04em',
            }}
          >
            다일 {dayIndex}/{totalDays}
          </Mono>
        )}
        {recurring && (
          <Mono
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'var(--bg-soft)',
              color: 'var(--ink-mute)',
              border: '1px solid var(--line)',
              letterSpacing: '0.04em',
            }}
            title="반복 일정"
          >
            반복
          </Mono>
        )}
      </div>
      {showLocation && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ color: 'var(--ink-mute)' }}>위치 · </span>
          {locationText || fallbackLocation}
        </div>
      )}
      {showUrl && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}
          title={urlText}
        >
          <span style={{ color: 'var(--ink-mute)' }}>링크 · </span>
          {urlHost}
        </div>
      )}
      {showAttendees && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ color: 'var(--ink-mute)' }}>참석 · </span>
          {block.attendees.join(', ')}
        </div>
      )}
      {showNotes && (
        <div
          style={{
            marginTop: 2,
            paddingTop: 6,
            borderTop: '1px solid var(--line-subtle)',
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {notesText}
        </div>
      )}
      {external && showFooterNote && (
        <Mono
          style={{
            fontSize: 9,
            color: 'var(--ink-mute)',
            letterSpacing: '0.04em',
          }}
        >
          외부 캘린더 — 편집은 원본 캘린더에서
        </Mono>
      )}
    </div>
  );
}
