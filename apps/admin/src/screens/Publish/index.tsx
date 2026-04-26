import { useCallback, useEffect, useMemo, useState } from 'react';
import { gitCommitPush, gitLog, gitStatus } from '../../lib/tauri';
import type { GitCommit, GitFile, GitState } from '../../lib/tauri';
import { Mono, PageHead } from '../../components/atoms/Atoms';
import { BranchPanel } from './BranchPanel';
import { FileList } from './FileList';
import { CommitBox } from './CommitBox';
import { CommitLog } from './CommitLog';

export function Publish() {
  const [state, setState] = useState<GitState | null>(null);
  const [recent, setRecent] = useState<GitCommit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contentsOnly, setContentsOnly] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoadingState(true);
    setError(null);
    try {
      const [s, log] = await Promise.all([gitStatus(), gitLog(10)]);
      setState(s);
      setRecent(log);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleFiles = useMemo<GitFile[]>(() => {
    if (!state) return [];
    if (!contentsOnly) return state.files;
    return state.files.filter((f) => f.path.startsWith('contents/'));
  }, [state, contentsOnly]);

  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(visibleFiles.map((f) => f.path));
      const next = new Set<string>();
      prev.forEach((p) => {
        if (visible.has(p)) next.add(p);
      });
      return next;
    });
  }, [visibleFiles]);

  const toggle = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === visibleFiles.length) return new Set();
      return new Set(visibleFiles.map((f) => f.path));
    });
  }, [visibleFiles]);

  const handleCommit = useCallback(
    async (message: string, push: boolean) => {
      if (!state) return;
      setPushing(true);
      setFlash(null);
      try {
        const commit = await gitCommitPush({
          message,
          paths: Array.from(selected),
          push,
        });
        setFlash({
          tone: 'ok',
          text: push
            ? `푸시 완료 · ${commit.hash} ${commit.subject}`
            : `커밋 생성 · ${commit.hash} ${commit.subject}`,
        });
        setSelected(new Set());
        await refresh();
      } catch (e) {
        setFlash({ tone: 'err', text: String(e) });
      } finally {
        setPushing(false);
      }
    },
    [state, selected, refresh],
  );

  if (error && !state) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="발행" sub="git 상태 읽기 실패" />
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

  if (!state) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="발행" sub="git 상태 읽는 중…" />
      </div>
    );
  }

  const onMain = state.branch === 'main';

  return (
    <div style={{ padding: '28px 48px 48px', maxWidth: 880, margin: '0 auto' }}>
      <PageHead
        title="발행"
        sub="main 브랜치로 푸시하면 GitHub Actions이 자동 배포합니다"
        right={
          <button
            onClick={refresh}
            disabled={loadingState || pushing}
            title="git 상태 새로고침"
            style={{
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-soft)',
              fontSize: 11.5,
              padding: '4px 10px',
              borderRadius: 6,
              cursor: loadingState ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loadingState ? '…' : '새로고침'}
          </button>
        }
      />

      <BranchPanel state={state} />

      {!onMain && (
        <div
          style={{
            margin: '12px 0 0',
            padding: '8px 12px',
            border: '1px solid var(--warn-soft)',
            background: 'var(--warn-soft)',
            color: 'var(--warn)',
            borderRadius: 6,
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
          }}
        >
          현재 브랜치는 <b>{state.branch}</b>. 푸시해도 배포는 트리거되지 않습니다 (main 전용).
        </div>
      )}

      <FileList
        files={visibleFiles}
        totalCount={state.files.length}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        contentsOnly={contentsOnly}
        onContentsOnlyChange={setContentsOnly}
      />

      <CommitBox
        canCommit={selected.size > 0 && !pushing}
        canPush={onMain && !!state.upstream}
        defaultPush={onMain}
        pushing={pushing}
        onSubmit={handleCommit}
      />

      {flash && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            border: `1px solid var(--${flash.tone === 'ok' ? 'ok' : 'err'}-soft)`,
            background: `var(--${flash.tone === 'ok' ? 'ok' : 'err'}-soft)`,
            color: `var(--${flash.tone === 'ok' ? 'ok' : 'err'})`,
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {flash.text}
        </div>
      )}

      {recent && recent.length > 0 && (
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
              최근 커밋
            </h2>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{recent.length}</Mono>
          </header>
          <CommitLog commits={recent} />
        </section>
      )}
    </div>
  );
}
