import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  llmDownloadModel,
  llmDownloadServer,
  llmOpenDataDir,
  llmStatus,
  type LlmStatus,
  type LlmDownloadEvent,
} from '../../lib/tauri';
import { Button, Eyebrow, Mono, StatusDot, Tag } from '../../components/atoms/Atoms';

interface ModelEntry {
  name: string;
  fileName: string;
  url: string;
  size: string;
  description: string;
}

const CATALOG: ModelEntry[] = [
  {
    name: 'Llama 3.2 3B Instruct',
    fileName: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    size: '약 2.0 GB',
    description: '가벼운 일·주·달 보고서용. 한국어 가능.',
  },
  {
    name: 'Qwen 2.5 7B Instruct',
    fileName: 'qwen2.5-7b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
    size: '약 4.7 GB',
    description: '균형 잡힌 품질. 한국어 우수.',
  },
  {
    name: 'Phi 3.5 Mini Instruct',
    fileName: 'Phi-3.5-mini-instruct-Q4_K_M.gguf',
    url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    size: '약 2.4 GB',
    description: '빠른 응답. 영어 우수.',
  },
];

interface DownloadState {
  fileName: string;
  downloaded: number;
  total: number | null;
  status: 'started' | 'progress' | 'finished' | 'failed';
  message?: string;
}

interface LLMSetupProps {
  onDismiss?: () => void;
}

export function LLMSetup({ onDismiss }: LLMSetupProps) {
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [download, setDownload] = useState<DownloadState | null>(null);
  const [serverDownload, setServerDownload] = useState<DownloadState | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await llmStatus();
      setStatus(s);
      setLoadError(null);
    } catch (e: unknown) {
      setLoadError(String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const installedNames = useMemo(
    () => new Set(status?.models.map((m) => m.name) ?? []),
    [status],
  );

  const beginServerDownload = useCallback(async () => {
    if (serverDownload && serverDownload.status !== 'failed' && serverDownload.status !== 'finished') return;
    setServerDownload({ fileName: 'llama-server', downloaded: 0, total: null, status: 'started' });
    try {
      await llmDownloadServer((event: LlmDownloadEvent) => {
        if (event.kind === 'started') {
          setServerDownload((prev) =>
            prev ? { ...prev, total: event.data.total, status: 'started' } : prev,
          );
        } else if (event.kind === 'progress') {
          setServerDownload((prev) =>
            prev
              ? {
                  ...prev,
                  downloaded: event.data.downloaded,
                  total: event.data.total,
                  status: 'progress',
                }
              : prev,
          );
        } else if (event.kind === 'finished') {
          setServerDownload((prev) => (prev ? { ...prev, status: 'finished' } : prev));
        } else if (event.kind === 'failed') {
          setServerDownload((prev) =>
            prev ? { ...prev, status: 'failed', message: event.data.message } : prev,
          );
        }
      });
      await refresh();
    } catch (e: unknown) {
      setServerDownload((prev) =>
        prev ? { ...prev, status: 'failed', message: String(e) } : prev,
      );
    }
  }, [serverDownload, refresh]);

  const beginDownload = useCallback(
    async (entry: ModelEntry) => {
      if (download && download.status !== 'failed' && download.status !== 'finished') return;
      setDownload({ fileName: entry.fileName, downloaded: 0, total: null, status: 'started' });
      try {
        await llmDownloadModel(entry.url, entry.fileName, (event: LlmDownloadEvent) => {
          if (event.kind === 'started') {
            setDownload((prev) =>
              prev && prev.fileName === entry.fileName
                ? { ...prev, total: event.data.total, status: 'started' }
                : prev,
            );
          } else if (event.kind === 'progress') {
            setDownload((prev) =>
              prev && prev.fileName === entry.fileName
                ? {
                    ...prev,
                    downloaded: event.data.downloaded,
                    total: event.data.total,
                    status: 'progress',
                  }
                : prev,
            );
          } else if (event.kind === 'finished') {
            setDownload((prev) =>
              prev && prev.fileName === entry.fileName ? { ...prev, status: 'finished' } : prev,
            );
          } else if (event.kind === 'failed') {
            setDownload((prev) =>
              prev && prev.fileName === entry.fileName
                ? { ...prev, status: 'failed', message: event.data.message }
                : prev,
            );
          }
        });
        await refresh();
      } catch (e: unknown) {
        setDownload((prev) =>
          prev && prev.fileName === entry.fileName
            ? { ...prev, status: 'failed', message: String(e) }
            : prev,
        );
      }
    },
    [download, refresh],
  );

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
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          maxHeight: '90vh',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Eyebrow style={{ marginBottom: 4 }}>로컬 LLM 설정</Eyebrow>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
              내 디바이스에서 보고서 생성
            </h2>
          </div>
          {onDismiss && (
            <Button ghost sm onClick={onDismiss}>
              나중에
            </Button>
          )}
        </header>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          {loadError && (
            <div
              style={{
                padding: 10,
                borderRadius: 6,
                background: 'var(--err-soft)',
                color: 'var(--err)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                marginBottom: 14,
              }}
            >
              {loadError}
            </div>
          )}

          <BinarySection
            status={status}
            download={serverDownload}
            onDownload={beginServerDownload}
            onRefresh={refresh}
          />

          <div style={{ marginTop: 24 }}>
            <Eyebrow>2 — 모델 선택</Eyebrow>
            <p style={{ margin: '6px 0 14px', color: 'var(--ink-soft)', fontSize: 12.5 }}>
              하나만 받아도 동작합니다. 나중에 여러 개 추가 가능.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CATALOG.map((entry) => (
                <ModelRow
                  key={entry.fileName}
                  entry={entry}
                  installed={installedNames.has(entry.fileName)}
                  download={download && download.fileName === entry.fileName ? download : null}
                  onDownload={() => beginDownload(entry)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BinarySection({
  status,
  download,
  onDownload,
  onRefresh,
}: {
  status: LlmStatus | null;
  download: DownloadState | null;
  onDownload: () => void;
  onRefresh: () => void;
}) {
  const present = status?.binPresent ?? false;
  const inProgress = download && (download.status === 'started' || download.status === 'progress');
  const failed = download?.status === 'failed';
  const pct =
    download && download.total && download.total > 0
      ? Math.min(100, Math.round((download.downloaded / download.total) * 100))
      : null;

  return (
    <div>
      <Eyebrow>1 — llama-server 바이너리</Eyebrow>
      <div
        style={{
          marginTop: 6,
          padding: 14,
          border: '1px solid var(--line)',
          borderRadius: 8,
          background: 'var(--bg-soft)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <StatusDot tone={present ? 'ok' : 'warn'} />
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                {present ? '설치됨' : '미설치'}
              </span>
            </div>
            <p
              style={{
                margin: '0 0 6px',
                color: 'var(--ink-soft)',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {present
                ? '내 디바이스에서 보고서를 생성할 준비가 끝났습니다.'
                : 'llama.cpp 최신 릴리스에서 llama-server를 자동으로 받아 설치합니다.'}
            </p>
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
              {status?.binPath ?? '(아직 모름)'}
            </Mono>
          </div>
          <div>
            {present ? (
              <Button sm ghost disabled>
                완료
              </Button>
            ) : inProgress ? (
              <Button sm ghost disabled>
                {pct !== null ? `${pct}%` : '받는 중…'}
              </Button>
            ) : (
              <Button sm onClick={onDownload}>
                {failed ? '다시 시도' : '받기'}
              </Button>
            )}
          </div>
        </div>

        {inProgress && (
          <div style={{ marginTop: 10 }}>
            <ProgressBar pct={pct} downloaded={download.downloaded} total={download.total} />
          </div>
        )}
        {failed && download.message && (
          <div
            style={{
              marginTop: 10,
              padding: 8,
              background: 'var(--err-soft)',
              color: 'var(--err)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              borderRadius: 6,
            }}
          >
            {download.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button sm ghost onClick={() => llmOpenDataDir().catch(() => {})}>
            폴더 열기
          </Button>
          <Button sm ghost onClick={onRefresh}>
            상태 새로고침
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModelRow({
  entry,
  installed,
  download,
  onDownload,
}: {
  entry: ModelEntry;
  installed: boolean;
  download: DownloadState | null;
  onDownload: () => void;
}) {
  const inProgress = download && (download.status === 'started' || download.status === 'progress');
  const failed = download?.status === 'failed';
  const finished = download?.status === 'finished' || installed;
  const pct =
    download && download.total && download.total > 0
      ? Math.min(100, Math.round((download.downloaded / download.total) * 100))
      : null;

  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>
              {entry.name}
            </span>
            <Tag>{entry.size}</Tag>
            {finished && (
              <span style={{ fontSize: 11, color: 'var(--ok)', fontFamily: 'var(--font-mono)' }}>
                ✓ 설치됨
              </span>
            )}
          </div>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12, marginBottom: 6 }}>
            {entry.description}
          </div>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{entry.fileName}</Mono>
        </div>
        <div>
          {finished ? (
            <Button sm ghost disabled>
              완료
            </Button>
          ) : inProgress ? (
            <Button sm ghost disabled>
              {pct !== null ? `${pct}%` : '받는 중…'}
            </Button>
          ) : (
            <Button sm onClick={onDownload}>
              받기
            </Button>
          )}
        </div>
      </div>
      {inProgress && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar pct={pct} downloaded={download.downloaded} total={download.total} />
        </div>
      )}
      {failed && download.message && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            background: 'var(--err-soft)',
            color: 'var(--err)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            borderRadius: 6,
          }}
        >
          {download.message}
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  pct,
  downloaded,
  total,
}: {
  pct: number | null;
  downloaded: number;
  total: number | null;
}) {
  return (
    <div>
      <div
        style={{
          height: 6,
          background: 'var(--bg-shade)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: pct !== null ? `${pct}%` : '40%',
            background: 'var(--blue)',
            transition: 'width 200ms',
          }}
        />
      </div>
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 4, display: 'block' }}>
        {formatBytes(downloaded)}
        {total !== null ? ` / ${formatBytes(total)}` : ''}
      </Mono>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
