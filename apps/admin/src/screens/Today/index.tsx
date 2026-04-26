import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DocSummary, GleanItem, Task } from '@vallista/content-core';
import { listDocs, listGlean, listTasks, updateTask } from '../../lib/tauri';
import { Mono, PageHead } from '../../components/atoms/Atoms';
import { useNavigate } from '../../shell/nav';
import { QuickAdd } from '../Plan/QuickAdd';
import { TodayTasks } from './TodayTasks';
import { RecentDocs } from './RecentDocs';
import { RecentGlean } from './RecentGlean';

export function Today() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [glean, setGlean] = useState<GleanItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((e: unknown) => setError(String(e)));
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
    listGlean()
      .then(setGlean)
      .catch((e: unknown) => setError(String(e)));
  }, []);

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

  const todayTasks = useMemo(() => {
    if (!tasks) return [];
    const today = todayKey();
    return tasks
      .filter((t) => !t.done && t.due && dayKey(t.due) <= today)
      .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''));
  }, [tasks]);

  const recentDocs = useMemo(() => {
    if (!docs) return [];
    return docs
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 5);
  }, [docs]);

  const recentGlean = useMemo(() => {
    if (!glean) return [];
    return glean
      .filter((g) => g.status !== 'archived')
      .sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1))
      .slice(0, 5);
  }, [glean]);

  if (error && !tasks && !docs && !glean) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="오늘" sub="대시보드 읽기 실패" />
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

  const greeting = greetText();
  const sub = summaryText(todayTasks.length, glean?.filter((g) => g.status === 'unread').length ?? 0);

  return (
    <div style={{ padding: '28px 48px 48px', maxWidth: 880, margin: '0 auto' }}>
      <PageHead title={greeting} sub={sub} />

      <QuickAdd
        onAdded={(t) => {
          upsertTask(t);
        }}
      />

      <Section
        title="오늘의 할 일"
        count={todayTasks.length}
        action={<NavLink to="plan">전체 보기 →</NavLink>}
      >
        <TodayTasks
          tasks={todayTasks}
          loading={tasks === null}
          onToggle={async (id, done) => {
            const updated = await updateTask(id, { done });
            upsertTask(updated);
          }}
        />
      </Section>

      <Section
        title="최근 노트"
        count={recentDocs.length}
        action={<NavLink to="atelier">글방 →</NavLink>}
      >
        <RecentDocs docs={recentDocs} loading={docs === null} />
      </Section>

      <Section
        title="최근 캡처"
        count={recentGlean.length}
        action={<NavLink to="glean">줍기 →</NavLink>}
      >
        <RecentGlean items={recentGlean} loading={glean === null} />
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{count}</Mono>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function NavLink({ to, children }: { to: 'plan' | 'atelier' | 'glean'; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--ink-mute)',
        fontSize: 11,
        fontFamily: 'inherit',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function greetText(): string {
  const h = new Date().getHours();
  if (h < 5) return '아직 깊은 밤';
  if (h < 11) return '좋은 아침';
  if (h < 14) return '점심 무렵';
  if (h < 18) return '오후의 한 페이지';
  if (h < 22) return '저녁의 갈무리';
  return '하루의 끝';
}

function summaryText(todayCount: number, unreadGlean: number): string {
  const parts: string[] = [];
  if (todayCount === 0) parts.push('오늘 해야 할 일은 비었습니다');
  else parts.push(`${todayCount}개 할 일`);
  if (unreadGlean > 0) parts.push(`${unreadGlean}개 안 읽은 캡처`);
  return parts.join(' · ');
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
