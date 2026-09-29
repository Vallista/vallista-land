import { useState } from 'react';
import type { Block } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import {
  EXTERNAL_COLOR,
  SOURCE_LABEL,
  dayOffset,
  isAllDayBlock,
  isLocal,
  isUnscheduledBlock,
  spanDayCount,
} from './blockMeta';
import { resolveLabel } from './labelCatalog';

interface Props {
  block: Block;
  dayDate?: string;
  segment?: { start: string; end: string; isMulti: boolean };
  showFooterNote?: boolean;
  /**
   * compact=true: 호버 카드처럼 좁은 자리에서 사용. 참석자 머리만 보이고 "외 N명".
   * compact=false: 다이얼로그 등에서 사용. 펼치기 토글로 전부 확인 가능.
   */
  compact?: boolean;
  excludedFromStats?: boolean;
}

const ATTENDEE_HEAD = 4;

export function BlockInfoView({
  block,
  dayDate,
  segment,
  showFooterNote = true,
  compact = false,
  excludedFromStats = false,
}: Props) {
  const [attendeesExpanded, setAttendeesExpanded] = useState(false);
  const external = !isLocal(block);
  const allDay = isAllDayBlock(block);
  const unscheduled = isUnscheduledBlock(block);
  const label = resolveLabel(block.kind, block.color);
  const c = external && !block.kind && !block.color
    ? EXTERNAL_COLOR
    : { bg: `${label.color}22`, border: `${label.color}66`, ink: label.color };
  const kindLabel = block.customLabel ?? label.name;
  const sourceLabel =
    block.source && block.source !== 'local' ? SOURCE_LABEL[block.source] : null;
  const totalDays = spanDayCount(block);
  const refDate = dayDate ?? block.date;
  const dayIndex = totalDays > 1 ? dayOffset(block.date, refDate) + 1 : 1;
  const timeText = unscheduled
    ? '시간 미정'
    : allDay
      ? totalDays > 1
        ? `종일 · ${block.date} → ${block.endDate ?? block.date}`
        : '종일'
      : segment?.isMulti
        ? `${segment.start}–${segment.end === '24:00' ? '24:00' : segment.end} · ${block.start}–${block.end} (${dayIndex}/${totalDays})`
        : totalDays > 1
          ? `${block.date} ${block.start} → ${block.endDate ?? block.date} ${block.end}`
          : `${block.start} – ${block.end}`;

  const hasActual = !!(block.actualStart || block.actualEnd);
  const actualStart = block.actualStart ?? block.start;
  const actualEnd = block.actualEnd ?? block.end;
  const plannedMin = diffMinutes(block.start, block.end);
  const actualMin = diffMinutes(actualStart, actualEnd);
  const driftMin =
    plannedMin !== null && actualMin !== null ? actualMin - plannedMin : null;

  const locationText = (block.location ?? '').trim();
  const notesText = (block.notes ?? '').trim();
  const calendarName = (block.calendarName ?? '').trim();
  const urlText = (block.url ?? '').trim();
  const organizer = (block.organizer ?? '').trim();
  const recurring = block.recurring === true;
  const urlHost = (() => {
    if (!urlText) return '';
    try {
      return new URL(urlText).host;
    } catch {
      return urlText.length > 48 ? urlText.slice(0, 48) + '…' : urlText;
    }
  })();
  const isLikelyUrl = (() => {
    if (!urlText) return false;
    return /^(https?:|webcal:|mailto:)/i.test(urlText);
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
  const showOrganizer = organizer.length > 0;

  return (
    <div
      style={{
        padding: 'var(--gap) var(--gap-lg)',
        background: 'var(--bg)',
        border: `1px solid ${excludedFromStats ? 'var(--line)' : c.border}`,
        borderLeft: `3px solid ${excludedFromStats ? 'var(--line-strong)' : c.ink}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap)',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        opacity: excludedFromStats ? 0.45 : 1,
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
            ...(compact ? clampStyle(1) : null),
          }}
          title={locationText || fallbackLocation}
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
        >
          <span style={{ color: 'var(--ink-mute)' }}>링크 · </span>
          {isLikelyUrl ? (
            <a
              href={urlText}
              target="_blank"
              rel="noreferrer"
              title={urlText}
              style={{ color: 'var(--blue)', textDecoration: 'underline' }}
            >
              {urlHost}
            </a>
          ) : (
            <span title={urlText}>{urlHost}</span>
          )}
        </div>
      )}
      {showOrganizer && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.4,
            wordBreak: 'break-word',
            ...(compact ? clampStyle(1) : null),
          }}
          title={organizer}
        >
          <span style={{ color: 'var(--ink-mute)' }}>주최 · </span>
          {organizer}
        </div>
      )}
      {showAttendees && (() => {
        const total = block.attendees.length;
        const overflow = total > ATTENDEE_HEAD;
        const expanded = !compact && attendeesExpanded;
        const shown = overflow && !expanded
          ? block.attendees.slice(0, ATTENDEE_HEAD)
          : block.attendees;
        const hiddenCount = total - shown.length;
        return (
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-soft)',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            <span style={{ color: 'var(--ink-mute)' }}>
              참석 · {total}명 ·{' '}
            </span>
            {shown.join(', ')}
            {hiddenCount > 0 && (
              <>
                <span style={{ color: 'var(--ink-mute)' }}> 외 {hiddenCount}명</span>
                {!compact && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => setAttendeesExpanded(true)}
                      style={attendeeToggleStyle}
                    >
                      모두 보기
                    </button>
                  </>
                )}
              </>
            )}
            {!compact && expanded && total > ATTENDEE_HEAD && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => setAttendeesExpanded(false)}
                  style={attendeeToggleStyle}
                >
                  접기
                </button>
              </>
            )}
          </div>
        );
      })()}
      {(hasActual || block.done) && !allDay && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: 'var(--ink-mute)' }}>실제 ·</span>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink)' }}>
            {actualStart} – {actualEnd}
          </Mono>
          {driftMin !== null && driftMin !== 0 && (
            <Mono
              style={{
                fontSize: 9.5,
                color:
                  Math.abs(driftMin) <= 5
                    ? 'var(--ok)'
                    : driftMin > 0
                      ? 'var(--hl-amber)'
                      : 'var(--hl-rose)',
                letterSpacing: '0.04em',
              }}
              title="계획 대비 차이"
            >
              {driftMin > 0 ? '+' : ''}
              {driftMin}m
            </Mono>
          )}
          {block.done && block.doneAt && (
            <Mono
              style={{
                fontSize: 9,
                color: 'var(--ok)',
                letterSpacing: '0.06em',
                marginLeft: 'auto',
              }}
            >
              ✓ 완료
            </Mono>
          )}
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
            ...(compact
              ? {
                  ...clampStyle(4),
                  position: 'relative',
                }
              : null),
          }}
          title={compact ? notesText : undefined}
        >
          {compact ? truncateText(notesText, 240) : linkifyText(notesText)}
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

function clampStyle(lines: number): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

const attendeeToggleStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-soft)',
  cursor: 'pointer',
  padding: 0,
  fontSize: 11,
  fontFamily: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function diffMinutes(a: string, b: string): number | null {
  const m1 = /^(\d{1,2}):(\d{2})$/.exec(a.trim());
  const m2 = /^(\d{1,2}):(\d{2})$/.exec(b.trim());
  if (!m1 || !m2) return null;
  const t1 = Number(m1[1]) * 60 + Number(m1[2]);
  const t2 = Number(m2[1]) * 60 + Number(m2[2]);
  return t2 - t1;
}

const URL_RE = /(https?:\/\/[^\s<>()]+|webcal:\/\/[^\s<>()]+|mailto:[^\s<>()]+)/gi;

function linkifyText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(URL_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const raw = match[0];
    const trimmed = raw.replace(/[.,;:!?)\]]+$/, '');
    const tail = raw.slice(trimmed.length);
    parts.push(
      <a
        key={`u-${i++}`}
        href={trimmed}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--blue)', textDecoration: 'underline' }}
      >
        {trimmed}
      </a>,
    );
    if (tail) parts.push(tail);
    last = idx + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
