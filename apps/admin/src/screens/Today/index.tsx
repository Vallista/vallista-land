import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Block, GleanItem, Mood, Task } from '@vallista/content-core';
import {
  getMood,
  listBlocksByDate,
  listBlocksInRange,
  listGlean,
  listMoodInRange,
  listTasks,
  setMood,
  setRetrospective,
  updateTask,
} from '../../lib/tauri';
import {
  Button,
  Card,
  CardTitle,
  Eyebrow,
  Input,
  Mono,
  Tag,
  Textarea,
} from '../../components/atoms/Atoms';
import { StreakIcon } from '../../components/atoms/Icons';
import { useNavigate } from '../../shell/nav';
import { Timeline } from './Timeline';

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
  const [error, setError] = useState<string | null>(null);

  const today = todayKey(now);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', tick);
    };
  }, []);

  useEffect(() => {
    listBlocksByDate(today)
      .then(setBlocks)
      .catch((e: unknown) => setError(String(e)));
    listTasks()
      .then(setTasks)
      .catch((e: unknown) => setError(String(e)));
    listGlean()
      .then(setGlean)
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
  }, [today]);

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
      <div style={{ padding: '32px 48px 80px', maxWidth: 1120, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 28,
            paddingBottom: 22,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 16,
              marginBottom: 10,
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <LifeStat
            label="오늘 일정"
            value={String(blockStats.total)}
            unit="블록"
            sub={
              blockStats.total > 0
                ? `${blockStats.done}개 끝, ${blockStats.remaining}개 남음`
                : '비어 있음'
            }
            tone="ink"
          />
          <LifeStat
            label="할 일"
            value={String(taskCounts.total - taskCounts.done)}
            unit={taskCounts.total > 0 ? `/${taskCounts.total}` : ''}
            sub={
              taskCounts.overdue > 0
                ? `연체 ${taskCounts.overdue}개`
                : nextBlock
                  ? `다음 ${nextBlock.start}`
                  : '여유'
            }
            tone="blue"
          />
          <LifeStat
            label="수신함"
            value={String(unreadGleanCount)}
            unit="새"
            sub={
              glean === null
                ? '읽는 중…'
                : `${glean.filter((g) => g.status === 'promoted').length} 발아`
            }
            tone="violet"
          />
          <MoodStat mood={todayMood} />
        </div>

        <Card padded={false} style={{ marginBottom: 20 }}>
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
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
              <Timeline blocks={sortedBlocks} now={now} />
            )}
          </div>
        </Card>

        {routineSummary.length > 0 && (
          <Card padded={false} style={{ marginBottom: 20 }}>
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
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <InboxCard
            items={inboxRows}
            unread={unreadGleanCount}
            loading={glean === null}
            onAll={() => navigate('glean')}
          />
          <PeopleCard people={peopleRows} loading={blocks === null} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.85fr 1.15fr',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <TasksCard
            tasks={todayTasks}
            loading={tasks === null}
            onToggle={async (id, done) => {
              const updated = await updateTask(id, { done });
              upsertTask(updated);
            }}
            onAll={() => navigate('plan')}
          />
          <MoodCard
            today={todayMood}
            series={moodSeries}
            loading={moodRange === null}
            onSubmit={handleMoodSubmit}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <RetrospectCard today={todayMood} onSubmit={handleRetrospectiveSubmit} />
        </div>
      </div>
    </div>
  );
}

function LifeStat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone: Tone;
}) {
  const c = toneColor(tone);
  return (
    <div
      style={{
        padding: '20px 22px',
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--bg)',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '-0.6px',
          color: c,
          lineHeight: 1.05,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-soft)',
              whiteSpace: 'nowrap',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <Mono
          style={{
            marginTop: 6,
            fontSize: 11,
            color: 'var(--ink-mute)',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sub}
        </Mono>
      )}
    </div>
  );
}

function MoodStat({ mood }: { mood: Mood | null | undefined }) {
  if (mood === undefined) {
    return <LifeStat label="컨디션" value="…" sub="읽는 중" tone="ok" />;
  }
  if (!mood || mood.energy === undefined || mood.mood === undefined) {
    return <LifeStat label="컨디션" value="—" sub="아직 기록 안 함" tone="ok" />;
  }
  const energyPct = Math.round(mood.energy * 100);
  const moodPct = Math.round(mood.mood * 100);
  return (
    <LifeStat
      label="컨디션"
      value={`${energyPct}`}
      unit="에너지"
      sub={`기분 ${moodPct}`}
      tone="ok"
    />
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
          padding: '14px 18px',
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
                gap: 12,
                padding: '10px 12px',
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
          padding: '8px 14px 12px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 6,
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

interface PersonRow {
  name: string;
  next: string | null;
  recent: string;
}

function PeopleCard({ people, loading }: { people: PersonRow[]; loading: boolean }) {
  return (
    <Card padded={false}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
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
                gap: 12,
                padding: '10px 12px',
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
                <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{p.name}</div>
                <Mono
                  style={{
                    fontSize: 10.5,
                    color: p.next ? 'var(--hl-violet)' : 'var(--ink-mute)',
                    display: 'block',
                    marginTop: 2,
                  }}
                >
                  {p.next ?? '—'}
                </Mono>
              </div>
              <Mono
                style={{ fontSize: 10.5, color: 'var(--ink-mute)', textAlign: 'right' }}
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
          padding: '14px 18px',
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
          padding: '8px 14px 12px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 6,
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
        gap: 10,
        padding: '8px 12px',
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
  today,
  series,
  loading,
  onSubmit,
}: {
  today: Mood | null | undefined;
  series: MoodSeriesEntry[];
  loading: boolean;
  onSubmit: (energy: number, mood: number, note?: string) => Promise<void>;
}) {
  const [energy, setEnergy] = useState<number>(() =>
    today?.energy !== undefined ? today.energy : 0.6,
  );
  const [mood, setMood] = useState<number>(() =>
    today?.mood !== undefined ? today.mood : 0.6,
  );
  const [note, setNote] = useState<string>(today?.note ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (today) {
      if (today.energy !== undefined) setEnergy(today.energy);
      if (today.mood !== undefined) setMood(today.mood);
      setNote(today.note ?? '');
    }
  }, [today]);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(energy, mood, note.trim() || undefined);
    } finally {
      setBusy(false);
    }
  };

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
        <CardTitle>아침 컨디션 · 30일</CardTitle>
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
            marginBottom: 14,
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

      <div
        style={{
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <SliderRow
          label="에너지"
          value={energy}
          onChange={setEnergy}
          color="var(--ok)"
        />
        <SliderRow
          label="기분"
          value={mood}
          onChange={setMood}
          color="var(--blue)"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="짧은 메모 (선택)"
            style={{ flex: 1, padding: '6px 10px', fontSize: 12.5 }}
          />
          <Button sm onClick={submit} disabled={busy}>
            {today ? '갱신' : '체크인'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--ink-soft)', minWidth: 44 }}>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{
          flex: 1,
          accentColor: color,
        }}
      />
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', minWidth: 28 }}>
        {Math.round(value * 100)}
      </Mono>
    </div>
  );
}

function RetrospectCard({
  today,
  onSubmit,
}: {
  today: Mood | null | undefined;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState<string>(today?.retrospectiveNote ?? '');
  const [busy, setBusy] = useState(false);
  const isEvening = new Date().getHours() >= 18;

  useEffect(() => {
    if (today) {
      setNote(today.retrospectiveNote ?? '');
    }
  }, [today]);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(note);
    } finally {
      setBusy(false);
    }
  };

  const recordedAt = today?.retrospectiveAt ? formatRel(today.retrospectiveAt) : null;
  const dirty = note.trim() !== (today?.retrospectiveNote ?? '');

  return (
    <Card padded>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 12,
        }}
      >
        <CardTitle>저녁 회고</CardTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isEvening && !today?.retrospectiveNote && (
            <Mono
              style={{
                fontSize: 10.5,
                color: 'var(--blue)',
                letterSpacing: '0.06em',
              }}
            >
              저녁 · 시작하기 좋은 시간
            </Mono>
          )}
          {recordedAt && (
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
              {recordedAt}
            </Mono>
          )}
        </div>
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          isEvening ? '오늘 하루를 짧게 적어보세요' : '잠자기 전에 돌아보세요'
        }
        rows={5}
        style={{
          width: '100%',
          fontSize: 13.5,
          lineHeight: 1.65,
          resize: 'vertical',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 10,
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', flex: 1 }}>
          {note.length > 0 ? `${note.length}자` : ' '}
        </Mono>
        <Button sm onClick={submit} disabled={busy || !dirty}>
          {busy ? '저장 중…' : today?.retrospectiveNote ? '갱신' : '기록'}
        </Button>
      </div>
    </Card>
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
            padding: '10px 12px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
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
