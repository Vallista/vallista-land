import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Block, GleanItem, Mood, Task } from '@vallista/content-core';
import {
  getMood,
  listBlocksByDate,
  listBlocksInRange,
  listEventNotes,
  listGlean,
  listMoodInRange,
  listTasks,
  mailListAllAccountsMessages,
  mailUnreadCountAll,
  setMood,
  setRetrospective,
  updateTask,
  type EventNote,
  type MailMessage,
} from '../../lib/tauri';
import {
  Button,
  Card,
  CardTitle,
  Eyebrow,
  Mono,
  Tag,
} from '../../components/atoms/Atoms';
import { DayLogIcon, StreakIcon } from '../../components/atoms/Icons';
import { useNavigate } from '../../shell/nav';
import { Timeline } from './Timeline';
import { RitualSlot } from './RitualSlot';
import { buildTimeStats, fmtMin, type TimeStats } from '../../lib/timeStats';

type Tone = 'ink' | 'blue' | 'violet' | 'ok' | 'rose';

export function Today() {
  const navigate = useNavigate();
  const [now, setNow] = useState<Date>(() => new Date());
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [glean, setGlean] = useState<GleanItem[] | null>(null);
  const [todayMood, setTodayMood] = useState<Mood | null | undefined>(undefined);
  const [moodRange, setMoodRange] = useState<Mood[] | null>(null);
  const [routineBlocks, setRoutineBlocks] = useState<Block[] | null>(null);
  const [eventNotes, setEventNotes] = useState<EventNote[] | null>(null);
  const [mailUnreadCount, setMailUnreadCount] = useState<number | null>(null);
  const [mailMessages, setMailMessages] = useState<MailMessage[] | null>(null);
  const [mailKey, setMailKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ritualFabOpen, setRitualFabOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<EventNote | null>(null);

  const today = todayKey(now);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        tick();
        setMailKey((k) => k + 1);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, []);

  useEffect(() => {
    listBlocksByDate(today)
      .then(setBlocks)
      .catch((e: unknown) => setError(String(e)));
    listTasks()
      .then(setTasks)
      .catch((e: unknown) => setError(String(e)));
    listGlean({ offset: 0, limit: 10000 })
      .then((p) => setGlean(p.items))
      .catch((e: unknown) => setError(String(e)));
    getMood(today)
      .then(setTodayMood)
      .catch(() => setTodayMood(null));
    const start = isoDaysAgo(today, 29);
    listMoodInRange(start, today)
      .then(setMoodRange)
      .catch(() => setMoodRange([]));
    listBlocksInRange(start, today)
      .then(setRoutineBlocks)
      .catch(() => setRoutineBlocks([]));
    listEventNotes()
      .then(setEventNotes)
      .catch(() => setEventNotes([]));
  }, [today]);

  useEffect(() => {
    const onTasksChanged = () => {
      listTasks().then(setTasks).catch(() => {});
    };
    window.addEventListener('bento:tasks-changed', onTasksChanged);
    return () => window.removeEventListener('bento:tasks-changed', onTasksChanged);
  }, []);

  // 메일은 별도 effect — 앱 포커스/가시성 회복 시 항상 null→로딩→결과 흐름
  useEffect(() => {
    let cancelled = false;
    setMailMessages(null);
    setMailUnreadCount(null);
    mailUnreadCountAll()
      .then((n) => { if (!cancelled) setMailUnreadCount(n); })
      .catch(() => { if (!cancelled) setMailUnreadCount(0); });
    mailListAllAccountsMessages(0)
      .then((msgs) => { if (!cancelled) setMailMessages(msgs); })
      .catch(() => { if (!cancelled) setMailMessages([]); });
    return () => { cancelled = true; };
  }, [mailKey]);

  const sortedBlocks = useMemo(() => {
    if (!blocks) return [];
    return blocks.slice().sort((a, b) => a.start.localeCompare(b.start));
  }, [blocks]);

  const blockStats = useMemo(() => {
    const total = sortedBlocks.length;
    const done = sortedBlocks.filter((b) => b.done || isPast(b, now)).length;
    const remaining = total - done;
    return { total, done, remaining };
  }, [sortedBlocks, now]);

  const timeStats = useMemo(() => buildTimeStats(sortedBlocks), [sortedBlocks]);

  const todayTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => {
        if (t.done) return false;
        if (t.due && dayKey(t.due) <= today) return true;
        if (t.startAt && dayKey(t.startAt) === today) return true;
        return false;
      })
      .sort((a, b) => {
        const ak =
          a.startAt && dayKey(a.startAt) === today ? a.startAt : a.due ?? '';
        const bk =
          b.startAt && dayKey(b.startAt) === today ? b.startAt : b.due ?? '';
        return ak.localeCompare(bk);
      });
  }, [tasks, today]);

  const taskCounts = useMemo(() => {
    if (!tasks) return { done: 0, total: 0, overdue: 0 };
    const relevant = tasks.filter(
      (t) =>
        (t.due && dayKey(t.due) <= today) ||
        (t.startAt && dayKey(t.startAt) === today),
    );
    const done = relevant.filter((t) => t.done).length;
    const overdue = relevant.filter(
      (t) => !t.done && t.due && dayKey(t.due) < today,
    ).length;
    return { done, total: relevant.length, overdue };
  }, [tasks, today]);

  const inboxRows = useMemo(() => {
    if (!glean) return [];
    return glean
      .filter((g) => g.status !== 'archived')
      .sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1))
      .slice(0, 5);
  }, [glean]);

  const unreadGleanCount = useMemo(() => {
    if (!glean) return 0;
    return glean.filter((g) => g.status === 'unread').length;
  }, [glean]);

  const peopleRows = useMemo(() => extractPeople(sortedBlocks, now), [sortedBlocks, now]);

  const nextBlock = useMemo(() => {
    const nowH = now.getHours() + now.getMinutes() / 60;
    return sortedBlocks.find((b) => {
      const startFrac = parseTime(b.start);
      return startFrac !== null && startFrac > nowH && !b.done;
    });
  }, [sortedBlocks, now]);

  const moodSeries = useMemo(() => buildMoodSeries(moodRange ?? [], today), [moodRange, today]);

  const routineSummary = useMemo(
    () => buildRoutineStreaks(routineBlocks ?? [], today),
    [routineBlocks, today],
  );

  const todayNotes = useMemo(() => {
    const all = eventNotes ?? [];
    const writtenToday = all.filter((n) => (n.updatedAt ?? '').slice(0, 10) === today);
    const forTodayEvent = all.filter((n) => n.eventDateSnapshot === today);
    const seen = new Set<string>();
    const merged: EventNote[] = [];
    for (const n of [...forTodayEvent, ...writtenToday]) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      merged.push(n);
    }
    merged.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return merged;
  }, [eventNotes, today]);

  const timeMode = getTimeMode(now);
  const isEveningMode = timeMode === 'evening' || timeMode === 'late';
  const moodRecorded = !!todayMood && todayMood.energy !== undefined && todayMood.mood !== undefined;
  const retroRecorded = !!todayMood?.retrospectiveNote;
  const showRitualFab = todayMood !== undefined && !(moodRecorded && (!isEveningMode || retroRecorded));

  useEffect(() => {
    if (!showRitualFab) setRitualFabOpen(false);
  }, [showRitualFab]);

  const upsertTask = useCallback((task: Task) => {
    setTasks((prev) => {
      if (!prev) return [task];
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...prev, task];
      const next = prev.slice();
      next[idx] = task;
      return next;
    });
  }, []);

  const handleMoodSubmit = useCallback(
    async (energy: number, mood: number, note?: string) => {
      try {
        const updated = await setMood({ date: today, energy, mood, note });
        setTodayMood(updated);
      } catch (e: unknown) {
        setError(String(e));
      }
    },
    [today],
  );

  const handleRetrospectiveSubmit = useCallback(
    async (note: string) => {
      try {
        const updated = await setRetrospective(today, note);
        setTodayMood(updated);
      } catch (e: unknown) {
        setError(String(e));
      }
    },
    [today],
  );

  if (error && !blocks && !tasks && !glean) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const greet = greetText(now);
  const dateHeading = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  const wd = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3) 80px', maxWidth: 1120, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 'calc(var(--gap-lg) * 1.5)',
            paddingBottom: 'calc(var(--gap-lg) * 1.2)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'var(--gap-lg)',
              marginBottom: 'var(--gap)',
              flexWrap: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <Mono
              style={{
                fontSize: 11,
                color: 'var(--ink-mute)',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              {dateHeading} · {wd}요일
            </Mono>
            <Mono style={{ fontSize: 11, color: 'var(--blue)', whiteSpace: 'nowrap' }}>
              주 {weekOfYear(now)} · {now.getMonth() + 1}월의 {now.getDate()}번째 날
            </Mono>
            <span style={{ flex: 1, minWidth: 8 }} />
            <Mono
              style={{
                fontSize: 11,
                color: 'var(--ink-mute)',
                whiteSpace: 'nowrap',
              }}
            >
              {pad(now.getHours())}:{pad(now.getMinutes())} 기준
            </Mono>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.6px',
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            <span style={{ color: 'var(--ink-soft)' }}>{greet},</span>{' '}
            {heroSentence(blockStats, todayTasks.length, unreadGleanCount)}
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              color: 'var(--ink-soft)',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {nextBlockSentence(now, nextBlock)}
          </p>
        </header>

        {/* 통계 한 줄 */}
        <StatBar
          blockStats={blockStats}
          taskCounts={taskCounts}
          unreadGleanCount={unreadGleanCount}
          mailUnreadCount={mailUnreadCount}
          todayMood={todayMood}
          nextBlock={nextBlock}
          glean={glean}
        />

        {/* ATF: 일정 타임라인 + 사람 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.65fr 1fr',
            gap: 'var(--gap-lg)',
            marginBottom: 'var(--gap-lg)',
          }}
        >
          <Card padded={false}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <CardTitle>오늘의 흐름</CardTitle>
              <div style={{ display: 'flex', gap: 'var(--gap-lg)', alignItems: 'center' }}>
                <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  {blockStats.total}블록 · {durationLabel(sortedBlocks)}
                </Mono>
                <Button sm ghost onClick={() => navigate('plan')}>
                  플랜으로
                </Button>
              </div>
            </div>
            <div style={{ padding: '16px 0' }}>
              {sortedBlocks.length === 0 ? (
                <EmptyTimeline onPlan={() => navigate('plan')} />
              ) : (
                <Timeline
                  blocks={sortedBlocks}
                  now={now}
                  notes={todayNotes.map((n) => ({ title: n.eventTitleSnapshot, body: n.body }))}
                />
              )}
            </div>
            {sortedBlocks.length > 0 && (
              <div
                style={{
                  padding: '8px 18px 10px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() =>
                    document
                      .getElementById('today-tasks')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  style={shortcutPillStyle(taskCounts.total > 0)}
                >
                  ↓ 할 일{' '}
                  {taskCounts.total - taskCounts.done > 0
                    ? `${taskCounts.total - taskCounts.done}개`
                    : '완료'}
                </button>
                <button
                  onClick={() =>
                    document
                      .getElementById('today-notes')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  style={shortcutPillStyle(todayNotes.length > 0)}
                >
                  ↓ 일정 메모{' '}
                  {todayNotes.length > 0 ? `${todayNotes.length}건` : '없음'}
                </button>
              </div>
            )}
          </Card>
          <PeopleCard people={peopleRows} loading={blocks === null} />
        </div>

        {/* ATF: 할 일 + 일정 메모 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--gap-lg)',
            marginBottom: 'calc(var(--gap-lg) * 2)',
          }}
        >
          <div id="today-tasks">
            <TasksCard
              tasks={todayTasks}
              loading={tasks === null}
              onToggle={async (id, done) => {
                const updated = await updateTask(id, { done });
                upsertTask(updated);
                window.dispatchEvent(new CustomEvent('bento:tasks-changed'));
              }}
              onAll={() => navigate('plan')}
            />
          </div>
          <div id="today-notes">
            <NotesCard notes={todayNotes} loading={eventNotes === null} onSelect={setSelectedNote} />
          </div>
        </div>

        {/* Below fold */}
        {sortedBlocks.length > 0 && (
          <TimeBudgetCard stats={timeStats} doneCount={blockStats.done} totalCount={blockStats.total} />
        )}

        {routineSummary.length > 0 && (
          <Card padded={false} style={{ marginBottom: 'var(--gap-lg)' }}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <CardTitle>루틴 · 스트릭</CardTitle>
              <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                30일 · {routineSummary.length}개
              </Mono>
            </div>
            <RoutineStreaks routines={routineSummary} />
          </Card>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--gap-lg)',
            marginBottom: 'var(--gap-lg)',
          }}
        >
          <InboxCard
            items={inboxRows}
            unread={unreadGleanCount}
            loading={glean === null}
            onAll={() => navigate('glean')}
          />
          <MailInboxCard
            messages={mailMessages}
            unread={mailUnreadCount ?? 0}
            onAll={() => navigate('mail')}
          />
        </div>

        <MoodCard series={moodSeries} loading={moodRange === null} />
      </div>

      {/* 체크인 FAB */}
      {showRitualFab && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          {ritualFabOpen && (
            <div
              style={{
                width: 360,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Mono style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  하루 기록
                </Mono>
                <button
                  onClick={() => setRitualFabOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-mute)',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '2px 4px',
                    fontFamily: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '14px 16px', overflow: 'hidden' }}>
                <RitualSlot
                  today={todayMood}
                  now={now}
                  onMoodSubmit={handleMoodSubmit}
                  onRetrospectiveSubmit={handleRetrospectiveSubmit}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => setRitualFabOpen((o) => !o)}
            title="체크인 · 기록"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: ritualFabOpen ? 'var(--blue)' : 'var(--bg)',
              border: `1.5px solid ${ritualFabOpen ? 'var(--blue)' : 'var(--line-strong)'}`,
              boxShadow: '0 2px 14px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <DayLogIcon size={18} color={ritualFabOpen ? 'white' : 'var(--ink)'} strokeWidth={1.6} />
          </button>
        </div>
      )}
      {selectedNote && (
        <EventNoteDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </div>
  );
}

function StatBar({
  blockStats,
  taskCounts,
  unreadGleanCount,
  mailUnreadCount,
  todayMood,
  nextBlock,
  glean,
}: {
  blockStats: { total: number; done: number; remaining: number };
  taskCounts: { done: number; total: number; overdue: number };
  unreadGleanCount: number;
  mailUnreadCount: number | null;
  todayMood: Mood | null | undefined;
  nextBlock: Block | undefined;
  glean: GleanItem[] | null;
}) {
  const moodRecorded = !!todayMood && todayMood.energy !== undefined && todayMood.mood !== undefined;
  const energyPct = moodRecorded ? Math.round((todayMood!.energy ?? 0) * 100) : null;
  const moodPct = moodRecorded ? Math.round((todayMood!.mood ?? 0) * 100) : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 'var(--gap-lg)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <StatPill
        label="일정"
        value={blockStats.total > 0 ? `${blockStats.done}/${blockStats.total}` : '비어 있음'}
        sub={blockStats.remaining > 0 ? `${blockStats.remaining}개 남음` : undefined}
        tone="ink"
      />
      <StatPill
        label="할일"
        value={`${taskCounts.total - taskCounts.done}/${taskCounts.total}`}
        sub={
          taskCounts.overdue > 0
            ? `연체 ${taskCounts.overdue}`
            : nextBlock
              ? `다음 ${nextBlock.start}`
              : undefined
        }
        tone="blue"
        warn={taskCounts.overdue > 0}
      />
      <StatPill
        label="수신함"
        value={mailUnreadCount === null ? <DotLoader color="var(--hl-rose)" /> : `새 메일 ${mailUnreadCount}개`}
        tone="rose"
      />
      <StatPill
        label="줍기"
        value={`${unreadGleanCount} 미읽음`}
        sub={
          glean !== null
            ? `${glean.filter((g) => g.status === 'promoted').length} 발행됨`
            : undefined
        }
        tone="violet"
      />
      <StatPill
        label="컨디션"
        value={
          todayMood === undefined
            ? '…'
            : energyPct !== null
              ? `에너지 ${energyPct}`
              : '—'
        }
        sub={moodPct !== null ? `기분 ${moodPct}` : '미기록'}
        tone="ok"
      />
    </div>
  );
}

function DotLoader({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: color,
            animation: `psm-pulse 1.1s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function StatPill({
  label,
  value,
  sub,
  tone,
  warn,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone: Tone;
  warn?: boolean;
}) {
  const c = warn ? 'var(--err)' : toneColor(tone);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 12px',
        border: `1px solid ${warn ? 'var(--err-soft)' : 'var(--line)'}`,
        borderRadius: 999,
        background: warn ? 'var(--err-soft)' : 'var(--bg)',
        minWidth: 0,
      }}
    >
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>
        {label}
      </Mono>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: c,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.2px',
        }}
      >
        {value}
      </span>
      {sub && (
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
          {sub}
        </Mono>
      )}
    </div>
  );
}

function TimeBudgetCard({
  stats,
  doneCount,
  totalCount,
}: {
  stats: TimeStats;
  doneCount: number;
  totalCount: number;
}) {
  const { plannedMin, actualMin, driftMin, byCategory, hasActual } = stats;
  const adherencePct =
    plannedMin > 0
      ? Math.max(0, Math.min(200, Math.round((actualMin / plannedMin) * 100)))
      : 0;
  const totalCat = byCategory.meet + byCategory.focus + byCategory.life;
  const meetPct = totalCat > 0 ? (byCategory.meet / totalCat) * 100 : 0;
  const focusPct = totalCat > 0 ? (byCategory.focus / totalCat) * 100 : 0;
  const lifePct = totalCat > 0 ? (byCategory.life / totalCat) * 100 : 0;
  const driftAbs = Math.abs(driftMin);
  const driftWithinFive = driftAbs <= 5;
  const driftColor = !hasActual
    ? 'var(--ink-mute)'
    : driftWithinFive
      ? 'var(--ok)'
      : driftMin > 0
        ? 'var(--hl-amber)'
        : 'var(--hl-rose)';
  const driftLabel = !hasActual
    ? '미기록'
    : driftMin === 0
      ? '0'
      : `${driftMin > 0 ? '+' : '−'}${fmtMin(driftAbs)}`;
  const completionPct =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card padded={false} style={{ marginBottom: 20 }}>
      <div
        style={{
          padding: 'calc(var(--card-pad) - 2px) var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>오늘의 시간 · 예산 대 실제</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          완료 {doneCount}/{totalCount} · {completionPct}%
        </Mono>
      </div>
      <div
        style={{
          padding: '16px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          borderBottom: totalCat > 0 ? '1px solid var(--line)' : 'none',
        }}
      >
        <BudgetMetric
          label="계획"
          value={fmtMin(plannedMin)}
          sub={`${totalCount}블록`}
          color="var(--ink)"
        />
        <BudgetMetric
          label="실제"
          value={hasActual ? fmtMin(actualMin) : '—'}
          sub={hasActual ? `진행 ${adherencePct}%` : '실제 미기록'}
          color="var(--blue)"
        />
        <BudgetMetric
          label="차이"
          value={driftLabel}
          sub={hasActual ? '계획 대비' : '실제 입력 후 표시'}
          color={driftColor}
        />
      </div>
      {totalCat > 0 && (
        <div style={{ padding: '12px 18px 16px' }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <Eyebrow>카테고리 분포</Eyebrow>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              회의 {fmtMin(byCategory.meet)} · 집중 {fmtMin(byCategory.focus)} ·
              생활 {fmtMin(byCategory.life)}
            </Mono>
          </div>
          <div
            style={{
              display: 'flex',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
              background: 'var(--bg-shade)',
            }}
          >
            {meetPct > 0 && (
              <div
                style={{
                  flex: meetPct,
                  background: 'var(--hl-violet)',
                  opacity: 0.75,
                }}
                title={`회의 ${Math.round(meetPct)}%`}
              />
            )}
            {focusPct > 0 && (
              <div
                style={{ flex: focusPct, background: 'var(--ok)', opacity: 0.75 }}
                title={`집중 ${Math.round(focusPct)}%`}
              />
            )}
            {lifePct > 0 && (
              <div
                style={{
                  flex: lifePct,
                  background: 'var(--ink-mute)',
                  opacity: 0.55,
                }}
                title={`생활 ${Math.round(lifePct)}%`}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function BudgetMetric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          marginTop: 8,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.4px',
          color,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      <Mono
        style={{
          marginTop: 4,
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {sub}
      </Mono>
    </div>
  );
}

function InboxCard({
  items,
  unread,
  loading,
  onAll,
}: {
  items: GleanItem[];
  unread: number;
  loading: boolean;
  onAll: () => void;
}) {
  return (
    <Card padded={false}>
      <div
        style={{
          padding: 'calc(var(--card-pad) - 2px) var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>수신함 · 어디서든 들어온 것들</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--blue)' }}>
          {unread > 0 ? `${unread} 새` : '모두 읽음'}
        </Mono>
      </div>
      {loading ? (
        <Skeleton text="읽는 중…" />
      ) : items.length === 0 ? (
        <EmptyState text="아직 캡처가 없습니다" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--gap-lg)',
                padding: 'var(--gap) var(--gap-lg)',
                borderRadius: 6,
                background:
                  it.status === 'unread' ? 'rgba(96,165,250,0.04)' : 'transparent',
              }}
            >
              <Tag
                style={{
                  minWidth: 44,
                  textAlign: 'center',
                  background:
                    it.status === 'unread' ? 'var(--blue-soft)' : 'var(--bg-shade)',
                  color: it.status === 'unread' ? 'var(--blue)' : 'var(--ink-soft)',
                }}
              >
                {sourceLabel(it.source)}
              </Tag>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: it.status === 'unread' ? 'var(--ink)' : 'var(--ink-2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: it.status === 'unread' ? 500 : 400,
                  }}
                >
                  {it.title || '(제목 없음)'}
                </div>
                {it.url && (
                  <Mono
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-mute)',
                      marginTop: 2,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hostname(it.url)}
                  </Mono>
                )}
              </div>
              <Mono
                style={{ fontSize: 11, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}
              >
                {formatRel(it.fetchedAt)}
              </Mono>
            </li>
          ))}
        </ul>
      )}
      <div
        style={{
          padding: 'var(--gap) var(--gap-lg) var(--gap-lg)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 'var(--gap)',
          alignItems: 'center',
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', flex: 1 }}>
          줍기 · 어디서든 빠른 캡처
        </Mono>
        <Button sm ghost onClick={onAll}>
          전부 보기
        </Button>
      </div>
    </Card>
  );
}

function parseSender(from: string): string {
  const m = /^(.+?)\s*</.exec(from);
  if (m?.[1]) return m[1].trim().replace(/^["']|["']$/g, '');
  return from.split('@')[0] ?? from;
}

function MailInboxCard({
  messages,
  unread,
  onAll,
}: {
  messages: MailMessage[] | null;
  unread: number;
  onAll: () => void;
}) {
  const loading = messages === null;
  const items = messages ? messages.slice(0, 7) : [];
  const hasAccounts = messages !== null;

  return (
    <Card padded={false}>
      <div
        style={{
          padding: 'calc(var(--card-pad) - 2px) var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>수신함 · 이메일</CardTitle>
        <Mono style={{ fontSize: 11, color: unread > 0 ? 'var(--hl-rose)' : 'var(--ink-mute)' }}>
          {loading ? '…' : unread > 0 ? `새 메일 ${unread}개` : '모두 읽음'}
        </Mono>
      </div>

      {loading ? (
        <div style={{ padding: '6px 0' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 18px',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div
                  style={{
                    height: 12,
                    borderRadius: 4,
                    width: `${55 + (i % 3) * 15}%`,
                    background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    height: 10,
                    borderRadius: 4,
                    width: `${35 + (i % 4) * 10}%`,
                    background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                  }}
                />
              </div>
              <div
                style={{
                  height: 10,
                  width: 36,
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
      ) : !hasAccounts || items.length === 0 ? (
        <EmptyState text={hasAccounts ? '새 메일이 없습니다' : '메일 계정을 추가하면 여기에 표시됩니다'} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
          {items.map((msg) => (
            <li
              key={`${msg.accountId}-${msg.uid}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '7px 12px',
                borderRadius: 6,
                background: !msg.seen ? 'rgba(96,165,250,0.04)' : 'transparent',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: !msg.seen ? 'var(--blue)' : 'transparent',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: !msg.seen ? 'var(--ink)' : 'var(--ink-2)',
                    fontWeight: !msg.seen ? 500 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {msg.subject || '(제목 없음)'}
                </div>
                <Mono
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-mute)',
                    marginTop: 2,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {parseSender(msg.from)}
                </Mono>
              </div>
              <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formatRel(msg.date)}
              </Mono>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          padding: 'var(--gap) var(--gap-lg) var(--gap-lg)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 'var(--gap)',
          alignItems: 'center',
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', flex: 1 }}>
          메일 · 모든 계정 통합
        </Mono>
        <Button sm ghost onClick={onAll}>
          메일함으로
        </Button>
      </div>
    </Card>
  );
}

interface PersonRow {
  name: string;
  next: string | null;
  recent: string;
}

function PeopleCard({ people, loading }: { people: PersonRow[]; loading: boolean }) {
  return (
    <Card padded={false}>
      <div style={{ padding: 'calc(var(--card-pad) - 2px) var(--card-pad)', borderBottom: '1px solid var(--line)' }}>
        <CardTitle>오늘 만날·기억할 사람</CardTitle>
      </div>
      {loading ? (
        <Skeleton text="읽는 중…" />
      ) : people.length === 0 ? (
        <EmptyState text="오늘 일정에 사람이 없습니다" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
          {people.map((p) => (
            <li
              key={p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--gap-lg)',
                padding: 'var(--gap) var(--gap-lg)',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: 'var(--bg-shade)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  flex: '0 0 auto',
                }}
              >
                {initial(p.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <Mono
                  style={{
                    fontSize: 10.5,
                    color: p.next ? 'var(--hl-violet)' : 'var(--ink-mute)',
                    display: 'block',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.next ?? '—'}
                </Mono>
              </div>
              <Mono
                style={{ fontSize: 10.5, color: 'var(--ink-mute)', textAlign: 'right', flexShrink: 0 }}
              >
                {p.recent}
              </Mono>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TasksCard({
  tasks,
  loading,
  onToggle,
  onAll,
}: {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onAll: () => void;
}) {
  return (
    <Card padded={false}>
      <div
        style={{
          padding: 'calc(var(--card-pad) - 2px) var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>오늘의 할 일</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{tasks.length}개</Mono>
      </div>
      {loading ? (
        <Skeleton text="읽는 중…" />
      ) : tasks.length === 0 ? (
        <EmptyState text="오늘 해야 할 일이 없습니다" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
          {tasks.slice(0, 6).map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </ul>
      )}
      <div
        style={{
          padding: 'var(--gap) var(--gap-lg) var(--gap-lg)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 'var(--gap)',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Button sm ghost onClick={onAll}>
          플랜에서 보기
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, done: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const todayK = todayKey(new Date());
  const overdue =
    task.due !== undefined && task.due !== null && dayKey(task.due) < todayK;
  const handle = async () => {
    setBusy(true);
    try {
      await onToggle(task.id, !task.done);
    } finally {
      setBusy(false);
    }
  };
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap)',
        padding: 'var(--gap) var(--gap-lg)',
        minHeight: 'var(--row-h)',
      }}
    >
      <button
        onClick={handle}
        disabled={busy}
        style={{
          width: 16,
          height: 16,
          border: `1.5px solid ${task.done ? 'var(--ok)' : 'var(--line-strong)'}`,
          borderRadius: 4,
          background: task.done ? 'var(--ok)' : 'transparent',
          color: 'var(--on-accent)',
          fontSize: 10,
          cursor: busy ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          padding: 0,
          flex: '0 0 16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13.5,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: task.done ? 'line-through' : 'none',
          opacity: task.done ? 0.55 : 1,
        }}
      >
        {task.title}
      </span>
      {task.due && (
        <Mono
          style={{
            fontSize: 10.5,
            padding: '2px 8px',
            borderRadius: 999,
            color: overdue ? 'var(--err)' : 'var(--warn)',
            background: overdue ? 'var(--err-soft)' : 'var(--warn-soft)',
          }}
        >
          {overdue ? '연체' : '오늘'}
        </Mono>
      )}
    </li>
  );
}

interface MoodSeriesEntry {
  date: string;
  energy: number | null;
  mood: number | null;
}

function MoodCard({
  series,
  loading,
}: {
  series: MoodSeriesEntry[];
  loading: boolean;
}) {
  return (
    <Card padded>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <CardTitle>컨디션 추이 · 30일</CardTitle>
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 10.5,
            color: 'var(--ink-mute)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: 'var(--ok)',
                opacity: 0.7,
              }}
            />
            에너지
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: 'var(--blue)',
                opacity: 0.7,
              }}
            />
            기분
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '8px 0', color: 'var(--ink-mute)', fontSize: 12 }}>
          읽는 중…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(30, 1fr)',
            gap: 3,
          }}
        >
          {series.map((d) => (
            <div
              key={d.date}
              title={`${d.date} · 에너지 ${d.energy === null ? '—' : Math.round(d.energy * 100)} · 기분 ${d.mood === null ? '—' : Math.round(d.mood * 100)}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: 56,
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  height: (d.energy ?? 0) * 26,
                  background: 'var(--ok)',
                  opacity: d.energy === null ? 0 : 0.7,
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  height: (d.mood ?? 0) * 26,
                  background: 'var(--blue)',
                  opacity: d.mood === null ? 0 : 0.7,
                  borderRadius: 1,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NotesCard({
  notes,
  loading,
  onSelect,
}: {
  notes: EventNote[];
  loading: boolean;
  onSelect: (note: EventNote) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Card padded={false}>
      <div
        style={{
          padding: 'calc(var(--card-pad) - 2px) var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>일정 메모</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          {notes.length > 0 ? `${notes.length}건` : '비어 있음'}
        </Mono>
      </div>
      {loading ? (
        <Skeleton text="읽는 중…" />
      ) : notes.length === 0 ? (
        <EmptyState text="오늘 일정에 남긴 메모가 없습니다" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notes.slice(0, 8).map((n) => (
            <li
              key={n.id}
              onClick={() => onSelect(n)}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: hovered === n.id ? 'var(--bg-shade)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Mono style={{ fontSize: 10, color: 'var(--blue)', flexShrink: 0 }}>
                  {n.eventDateSnapshot}
                </Mono>
                <span
                  style={{
                    color: 'var(--ink)',
                    fontSize: 12,
                    fontWeight: 500,
                    flex: 1,
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {n.eventTitleSnapshot || '(제목 없음)'}
                </span>
                <Mono style={{ fontSize: 10, color: 'var(--ink-faint)', flexShrink: 0 }}>
                  {formatRel(n.updatedAt)}
                </Mono>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                } as React.CSSProperties}
              >
                {n.body}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EventNoteDetailModal({ note, onClose }: { note: EventNote; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.46)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 220,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 56px rgba(0,0,0,0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>
              {note.eventTitleSnapshot || '(제목 없음)'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>{note.eventDateSnapshot}</Mono>
              <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{formatRel(note.updatedAt)}</Mono>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              wordBreak: 'break-word',
            }}
          >
            {note.body}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RoutineSummary {
  title: string;
  streak: number;
  best: number;
  rate: number;
  scheduledDays: number;
  doneDays: number;
  cells: { date: string; state: 'done' | 'missed' | 'none' }[];
}

function RoutineStreaks({ routines }: { routines: RoutineSummary[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
      {routines.map((r) => (
        <li
          key={r.title}
          style={{
            padding: 'var(--gap) var(--gap-lg)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'var(--gap)',
            alignItems: 'center',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: 6,
              }}
            >
              {r.title}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(30, 1fr)',
                gap: 2,
              }}
            >
              {r.cells.map((c) => (
                <span
                  key={c.date}
                  title={`${c.date} · ${
                    c.state === 'done' ? '완료' : c.state === 'missed' ? '놓침' : '없음'
                  }`}
                  style={{
                    height: 12,
                    borderRadius: 2,
                    background:
                      c.state === 'done'
                        ? 'var(--ok)'
                        : c.state === 'missed'
                          ? 'var(--err-soft)'
                          : 'var(--bg-shade)',
                    opacity: c.state === 'none' ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
              minWidth: 64,
            }}
          >
            <Mono
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: r.streak > 0 ? 'var(--ok)' : 'var(--ink-mute)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {r.streak > 0 ? (
                <>
                  <StreakIcon size={11} />
                  {r.streak}
                </>
              ) : (
                '— 0'
              )}
            </Mono>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {r.doneDays}/{r.scheduledDays} · {Math.round(r.rate * 100)}%
            </Mono>
            <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>최고 {r.best}</Mono>
          </div>
        </li>
      ))}
    </ul>
  );
}

function buildRoutineStreaks(blocks: Block[], today: string): RoutineSummary[] {
  const routines = blocks.filter((b) => b.kind === 'routine');
  if (routines.length === 0) return [];
  const byTitle = new Map<string, Map<string, boolean>>();
  for (const b of routines) {
    const title = b.title.trim();
    if (!title) continue;
    let m = byTitle.get(title);
    if (!m) {
      m = new Map<string, boolean>();
      byTitle.set(title, m);
    }
    const prev = m.get(b.date) ?? false;
    m.set(b.date, prev || b.done);
  }
  const summaries: RoutineSummary[] = [];
  for (const [title, dayMap] of byTitle) {
    const cells: RoutineSummary['cells'] = [];
    let scheduledDays = 0;
    let doneDays = 0;
    for (let i = 29; i >= 0; i--) {
      const d = isoDaysAgo(today, i);
      if (dayMap.has(d)) {
        scheduledDays += 1;
        if (dayMap.get(d)) {
          doneDays += 1;
          cells.push({ date: d, state: 'done' });
        } else {
          cells.push({ date: d, state: 'missed' });
        }
      } else {
        cells.push({ date: d, state: 'none' });
      }
    }
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i]!;
      if (c.state === 'done') streak += 1;
      else if (c.state === 'missed') break;
      else if (i === cells.length - 1) continue;
      else break;
    }
    let best = 0;
    let cur = 0;
    for (const c of cells) {
      if (c.state === 'done') {
        cur += 1;
        if (cur > best) best = cur;
      } else if (c.state === 'missed') {
        cur = 0;
      }
    }
    const rate = scheduledDays > 0 ? doneDays / scheduledDays : 0;
    summaries.push({ title, streak, best, rate, scheduledDays, doneDays, cells });
  }
  summaries.sort((a, b) => b.streak - a.streak || b.scheduledDays - a.scheduledDays);
  return summaries.slice(0, 6);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '24px 0',
        color: 'var(--ink-mute)',
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function Skeleton({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '20px 0',
        color: 'var(--ink-faint)',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function EmptyTimeline({ onPlan }: { onPlan: () => void }) {
  return (
    <div
      style={{
        padding: '24px 22px',
        color: 'var(--ink-mute)',
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      오늘 등록된 블록이 없습니다.{' '}
      <button
        onClick={onPlan}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--blue)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        플랜에서 추가 →
      </button>
    </div>
  );
}

function shortcutPillStyle(active: boolean) {
  return {
    padding: '3px 10px',
    fontSize: 11,
    fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--line-strong)' : 'var(--line)'}`,
    background: 'transparent',
    color: active ? 'var(--ink-soft)' : 'var(--ink-faint)',
    borderRadius: 999,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as const;
}

function toneColor(tone: Tone): string {
  switch (tone) {
    case 'blue':
      return 'var(--blue)';
    case 'violet':
      return 'var(--hl-violet)';
    case 'ok':
      return 'var(--ok)';
    case 'rose':
      return 'var(--hl-rose)';
    default:
      return 'var(--ink)';
  }
}

function getTimeMode(now: Date): 'morning' | 'afternoon' | 'evening' | 'late' {
  const h = now.getHours();
  if (h < 5) return 'late';
  if (h < 14) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function greetText(now: Date): string {
  const h = now.getHours();
  if (h < 5) return '아직 깊은 밤이에요';
  if (h < 11) return '아침이에요';
  if (h < 14) return '점심 무렵이에요';
  if (h < 18) return '오후예요';
  if (h < 22) return '저녁이에요';
  return '하루의 끝이에요';
}

function heroSentence(
  stats: { total: number; remaining: number },
  taskCount: number,
  unread: number,
): string {
  if (stats.total === 0 && taskCount === 0 && unread === 0) {
    return '비어 있는 하루를 즐겨봐요.';
  }
  if (stats.total > 0) {
    return `오늘 ${stats.total}블록 중 ${stats.remaining}개가 남아 있어요.`;
  }
  if (taskCount > 0) return `${taskCount}개 할 일이 기다려요.`;
  return `${unread}개 캡처가 쌓여 있어요.`;
}

function nextBlockSentence(now: Date, next: Block | undefined): string {
  if (!next) return '다음 일정은 없습니다.';
  const start = parseTime(next.start);
  if (start === null) return `다음: ${next.title}`;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const diff = Math.max(0, Math.round((start - nowH) * 60));
  if (diff === 0) return `지금 시작 — ${next.title}`;
  if (diff < 60) return `다음 일정 ${next.title} (${next.start})까지 ${diff}분 남음.`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `다음 일정 ${next.title} (${next.start})까지 ${h}시간 ${m}분 남음.`;
}

function durationLabel(blocks: Block[]): string {
  let mins = 0;
  for (const b of blocks) {
    const s = parseTime(b.start);
    const e = parseTime(b.end);
    if (s === null || e === null) continue;
    if (e > s) mins += (e - s) * 60;
  }
  if (mins === 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function isPast(b: Block, now: Date): boolean {
  const e = parseTime(b.end);
  if (e === null) return false;
  return now.getHours() + now.getMinutes() / 60 >= e;
}

function extractPeople(blocks: Block[], now: Date): PersonRow[] {
  const seen = new Map<string, PersonRow>();
  const nowH = now.getHours() + now.getMinutes() / 60;
  for (const b of blocks) {
    for (const a of b.attendees) {
      const key = a.trim();
      if (!key) continue;
      const startFrac = parseTime(b.start);
      const upcoming =
        startFrac !== null && startFrac >= nowH && !b.done
          ? `오늘 ${b.start} · ${b.title}`
          : null;
      const past = startFrac !== null && startFrac < nowH ? `오늘 ${b.start}` : '—';
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { name: key, next: upcoming, recent: upcoming ? '예정' : past });
      } else if (upcoming && !existing.next) {
        existing.next = upcoming;
      }
    }
  }
  return Array.from(seen.values()).slice(0, 5);
}

function buildMoodSeries(records: Mood[], today: string): MoodSeriesEntry[] {
  const map = new Map<string, Mood>();
  for (const r of records) map.set(r.date, r);
  const out: MoodSeriesEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = isoDaysAgo(today, i);
    const r = map.get(d);
    out.push({
      date: d,
      energy: r?.energy ?? null,
      mood: r?.mood ?? null,
    });
  }
  return out;
}

function sourceLabel(source: GleanItem['source']): string {
  switch (source) {
    case 'web':
      return 'Web';
    case 'rss':
      return 'RSS';
    case 'youtube':
      return 'YT';
    case 'paste':
      return 'Paste';
    default:
      return String(source);
  }
}

function hostname(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatRel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function initial(name: string): string {
  const trimmed = name.replace(/^@/, '').trim();
  return trimmed.slice(0, 1) || '·';
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
  return h + mi / 60;
}

function todayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoDaysAgo(today: string, days: number): string {
  const t = Date.parse(today + 'T00:00:00');
  if (!Number.isFinite(t)) return today;
  const d = new Date(t);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekOfYear(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  return 1 + Math.round((diff - ((firstThursday.getUTCDay() + 6) % 7) + 3) / 7);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
