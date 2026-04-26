import { useCallback, useEffect, useMemo, useState } from 'react';
import { gitCommitPush, gitLog, gitStatus } from '../../lib/tauri';
import type { GitCommit, GitFile, GitState } from '../../lib/tauri';
import { Button, Eyebrow, Mono } from '../../components/atoms/Atoms';
import { BranchPanel } from './BranchPanel';
import { FileList } from './FileList';
import { CommitBox } from './CommitBox';
import { CommitLog } from './CommitLog';

export function DeployDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    if (open) refresh();
  }, [open, refresh]);

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

  if (!open) return null;
  const onMain = state?.branch === 'main';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          maxHeight: '90vh',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '16px 22px 12px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Eyebrow>↗ 배포</Eyebrow>
            <h2
              style={{
                margin: '4px 0 0',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              main 푸시 → GitHub Actions 자동 빌드
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button sm ghost onClick={refresh} disabled={loadingState || pushing}>
              {loadingState ? '…' : '새로고침'}
            </Button>
            <Button sm ghost onClick={onClose}>
              닫기
            </Button>
          </div>
        </header>

        <div
          style={{
            padding: 22,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {error && !state && (
            <div
              style={{
                padding: 12,
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
          )}

          {state && <BranchPanel state={state} />}

          {state && !onMain && (
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid var(--warn-soft)',
                background: 'var(--warn-soft)',
                color: 'var(--warn)',
                borderRadius: 6,
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
              }}
            >
              현재 브랜치 <b>{state.branch}</b> — 푸시해도 배포는 트리거되지 않습니다 (main 전용).
            </div>
          )}

          {state && (
            <FileList
              files={visibleFiles}
              totalCount={state.files.length}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              contentsOnly={contentsOnly}
              onContentsOnlyChange={setContentsOnly}
            />
          )}

          {state && (
            <CommitBox
              canCommit={selected.size > 0 && !pushing}
              canPush={onMain && !!state.upstream}
              defaultPush={onMain}
              pushing={pushing}
              onSubmit={handleCommit}
            />
          )}

          {flash && (
            <div
              style={{
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
            <section style={{ marginTop: 4 }}>
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
                <Eyebrow>최근 커밋</Eyebrow>
                <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                  {recent.length}
                </Mono>
              </header>
              <CommitLog commits={recent} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
