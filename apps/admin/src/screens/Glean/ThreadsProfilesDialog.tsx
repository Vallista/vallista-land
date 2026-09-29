import { useState } from 'react';
import { Button, Checkbox, Input, Mono } from '../../components/atoms/Atoms';
import {
  addThreadsProfile,
  removeThreadsProfile,
  setThreadsAutosync,
  syncThreadsProfile,
  type GleanCounts,
  type ThreadsProfile,
} from '../../lib/tauri';

interface Props {
  profiles: ThreadsProfile[];
  onProfilesChange: (profiles: ThreadsProfile[]) => void;
  counts: GleanCounts | null;
  onItemsRefresh: () => void;
}

function threadsFeedId(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
    if (path) return `threads_${path}`;
  } catch {
    // ignore
  }
  return `threads_${url.length}`;
}

function relTime(iso?: string | null): string {
  if (!iso) return '동기화 없음';
  const diff = Date.now() - Date.parse(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

export function ThreadsProfilePanel({
  profiles,
  onProfilesChange,
  counts,
  onItemsRefresh,
}: Props) {
  const [addUrl, setAddUrl] = useState('');
  const [addLabel, setAddLabel] = useState('');
  const [addAutoSync, setAddAutoSync] = useState(true);
  const [addScrolls, setAddScrolls] = useState('50');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const url = addUrl.trim();
    if (!url) return;
    setBusy('add');
    setError(null);
    try {
      const scrolls = Number(addScrolls);
      const profile = await addThreadsProfile(
        url,
        addLabel.trim(),
        addAutoSync,
        Number.isFinite(scrolls) && scrolls > 0 ? scrolls : undefined,
      );
      onProfilesChange([...profiles, profile]);
      onItemsRefresh();
      setAddUrl('');
      setAddLabel('');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSync = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const updated = await syncThreadsProfile(id);
      onProfilesChange(profiles.map((p) => (p.id === id ? updated : p)));
      onItemsRefresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleToggleAutoSync = async (id: string, enabled: boolean) => {
    try {
      const updated = await setThreadsAutosync(id, enabled);
      onProfilesChange(profiles.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleRemove = async (id: string) => {
    setBusy(id + '_del');
    try {
      await removeThreadsProfile(id);
      onProfilesChange(profiles.filter((p) => p.id !== id));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 프로필 목록 */}
        {profiles.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              overflowY: 'auto',
              maxHeight: 280,
            }}
          >
            {profiles.map((p) => {
              const count = counts?.byFeedId[threadsFeedId(p.url)] ?? 0;
              const isLoading = busy === p.id || busy === p.id + '_del';
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    background: p.autoSync ? 'var(--bg-soft)' : 'transparent',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Checkbox
                      checked={p.autoSync}
                      disabled={isLoading}
                      onChange={(v) => handleToggleAutoSync(p.id, v)}
                      title={p.autoSync ? '자동 동기화 켜짐' : '자동 동기화 꺼짐'}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {p.label}
                    </span>
                    <span style={{ flex: 1 }} />
                    <button
                      onClick={() => handleSync(p.id)}
                      disabled={isLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--blue)',
                        cursor: isLoading ? 'wait' : 'pointer',
                        fontSize: 11,
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      {busy === p.id ? '…' : '동기화'}
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={isLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--err)',
                        cursor: isLoading ? 'wait' : 'pointer',
                        fontSize: 11,
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      제거
                    </button>
                  </div>
                  <span title={p.url} style={{ display: 'block' }}>
                    <Mono
                      style={{
                        fontSize: 10.5,
                        color: 'var(--ink-mute)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {p.url}
                    </Mono>
                  </span>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-mute)',
                    }}
                  >
                    마지막 · {relTime(p.lastSyncedAt)}
                    {p.lastResult?.added ? ` · +${p.lastResult.added}` : ''}
                    {count > 0 ? ` · ${count}개` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 구분선 */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Mono style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600 }}>프로필 추가</Mono>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>프로필 URL</Mono>
            <Input
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="https://www.threads.com/@username"
              disabled={!!busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>레이블 (선택)</Mono>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="내 이름 (비우면 @username)"
                disabled={!!busy}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>최대 스크롤</Mono>
              <Input
                value={addScrolls}
                onChange={(e) => setAddScrolls(e.target.value)}
                placeholder="50"
                disabled={!!busy}
                style={{ width: 70 }}
              />
            </div>
          </div>

          <Checkbox
            checked={addAutoSync}
            onChange={setAddAutoSync}
            disabled={!!busy}
          >
            매 시간 자동 동기화 (새 게시글만)
          </Checkbox>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--err-soft)',
              border: '1px solid var(--err-soft)',
              borderRadius: 6,
              color: 'var(--err)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button sm onClick={handleAdd} disabled={!!busy || !addUrl.trim()}>
            {busy === 'add' ? '가져오는 중…' : '가져오기'}
          </Button>
        </div>
    </div>
  );
}
