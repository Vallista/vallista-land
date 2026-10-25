import type { CSSProperties } from 'react';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';
import {
  describeSchedule,
  fmtSecs,
  pct,
  slotLabel,
  type CellState,
  type RoutineRow,
} from '../../lib/routineStats';
import { HoverTip, dateLabel, useHoverTip } from './HoverTip';
import { levelColor } from './Heatmap';
import { routineColor } from './meta';

const COLS = 'minmax(170px, 2.2fr) 84px 72px minmax(110px, 1.2fr) 86px 150px';

const STRIP_LEVEL: Record<CellState, 'none' | 0 | 2 | 4> = {
  done: 4,
  extra: 2,
  missed: 0,
  pending: 0,
  off: 'none',
};

const STATE_TEXT: Record<CellState, string> = {
  done: '완료',
  extra: '완료 (예정 없던 날)',
  missed: '놓침',
  pending: '아직 안 함',
  off: '쉬는 날',
};

/** 루틴별 성과 표. 행을 누르면 아래 분석이 그 루틴만 보여준다 */
export function RoutineTable({
  rows,
  focusId,
  onFocus,
}: {
  rows: RoutineRow[];
  focusId: string | null;
  onFocus: (id: string | null) => void;
}) {
  const { tip, show, hide } = useHoverTip();
  return (
    <Card padded={false}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>루틴별 성과</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>행을 누르면 그 루틴만 분석</Mono>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div role="table" style={{ minWidth: 720 }}>
          <div
            role="row"
            style={{ ...rowGrid, padding: '8px 18px', borderBottom: '1px solid var(--line)' }}
          >
            {['루틴', '연속', '7일', '30일 달성률', '30일 시간', '최근 14일'].map((h, i) => (
              <Mono
                key={h}
                role="columnheader"
                style={{
                  fontSize: 10,
                  color: 'var(--ink-mute)',
                  letterSpacing: '0.04em',
                  textAlign: i === 0 || i === 3 || i === 5 ? 'left' : 'right',
                  paddingRight: i === 0 || i === 3 || i === 5 ? 0 : 12,
                }}
              >
                {h}
              </Mono>
            ))}
          </div>
          {rows.map((row) => {
            const r = row.routine;
            const focused = focusId === r.id;
            return (
              <button
                key={r.id}
                role="row"
                onClick={() => onFocus(focused ? null : r.id)}
                aria-pressed={focused}
                style={{
                  ...rowGrid,
                  width: '100%',
                  padding: '10px 18px',
                  border: 'none',
                  borderBottom: '1px solid var(--line-subtle)',
                  background: focused ? 'var(--bg-shade)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  alignItems: 'center',
                }}
              >
                <div
                  role="cell"
                  style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: routineColor(r.color),
                      flex: '0 0 8px',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.title}
                    </div>
                    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                      {describeSchedule(r)} · {slotLabel(r.slot)}
                    </Mono>
                  </div>
                </div>
                <div role="cell" style={numCell}>
                  <Mono
                    style={{
                      fontSize: 12.5,
                      color: row.streak.current > 0 ? 'var(--ink)' : 'var(--ink-mute)',
                    }}
                  >
                    {row.streak.current}일
                  </Mono>
                  <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                    최고 {row.streak.best}
                  </Mono>
                </div>
                <div role="cell" style={numCell}>
                  <Mono style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                    {pct(row.rate7.rate)}
                  </Mono>
                  <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                    {row.rate7.done}/{row.rate7.scheduled}
                  </Mono>
                </div>
                <div
                  role="cell"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}
                >
                  <span
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--ok-soft)',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${Math.round((row.rate30.rate ?? 0) * 100)}%`,
                        background: 'var(--ok)',
                        borderRadius: 999,
                      }}
                    />
                  </span>
                  <Mono
                    style={{
                      fontSize: 11.5,
                      color: 'var(--ink-2)',
                      minWidth: 34,
                      textAlign: 'right',
                    }}
                  >
                    {pct(row.rate30.rate)}
                  </Mono>
                </div>
                <div role="cell" style={numCell}>
                  <Mono
                    style={{
                      fontSize: 12,
                      color: row.secs30 >= 60 ? 'var(--ink-2)' : 'var(--ink-faint)',
                    }}
                  >
                    {row.secs30 >= 60 ? fmtSecs(row.secs30) : '–'}
                  </Mono>
                </div>
                <div role="cell" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {row.recent.map((c) => (
                    <span
                      key={c.date}
                      onMouseEnter={(e) =>
                        show(e, { value: STATE_TEXT[c.state], label: dateLabel(c.date) })
                      }
                      onMouseLeave={hide}
                      style={{
                        width: 8,
                        height: 14,
                        borderRadius: 2,
                        background: levelColor(STRIP_LEVEL[c.state]),
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <HoverTip tip={tip} />
    </Card>
  );
}

const rowGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COLS,
  gap: 8,
};

const numCell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 1,
  paddingRight: 12,
};
