import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  keychainHasToken,
  keychainSetToken,
  llmDownloadModel,
  llmDownloadServer,
  llmGetApiKey,
  llmGetSettings,
  llmOpenDataDir,
  llmSaveSettings,
  llmStatus,
  type LlmDownloadEvent,
  type LlmSettings,
  type LlmStatus,
} from '../../lib/tauri';
import { loadLLMProvider, resetLLMProvider } from '../../lib/llm';
import { Button, Eyebrow, Mono, StatusDot, Tag } from '../../components/atoms/Atoms';

type ProviderTab = 'local' | 'claude' | 'openai' | 'gemini';

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

const CLAUDE_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'o1-mini'];
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro'];

interface DownloadState {
  fileName: string;
  downloaded: number;
  total: number | null;
  status: 'started' | 'progress' | 'finished' | 'failed';
  message?: string;
}

export function LLMSetupContent() {
  const [activeTab, setActiveTab] = useState<ProviderTab>('local');
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderTab>('local');

  const [localStatus, setLocalStatus] = useState<LlmStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [download, setDownload] = useState<DownloadState | null>(null);
  const [serverDownload, setServerDownload] = useState<DownloadState | null>(null);
  const [selectedLocalModel, setSelectedLocalModel] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<Record<ProviderTab, string>>({
    local: '',
    claude: '',
    openai: '',
    gemini: '',
  });
  const [hasKey, setHasKey] = useState<Record<ProviderTab, boolean>>({
    local: false,
    claude: false,
    openai: false,
    gemini: false,
  });
  const [selectedModel, setSelectedModel] = useState<Record<ProviderTab, string>>({
    local: '',
    claude: 'claude-sonnet-4-6',
    openai: 'gpt-4o',
    gemini: 'gemini-2.0-flash',
  });
  const [testResult, setTestResult] = useState<Record<ProviderTab, string | null>>({
    local: null,
    claude: null,
    openai: null,
    gemini: null,
  });
  const [testRunning, setTestRunning] = useState<Record<ProviderTab, boolean>>({
    local: false,
    claude: false,
    openai: false,
    gemini: false,
  });
  const [activating, setActivating] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const refreshLocal = useCallback(async () => {
    try {
      const s = await llmStatus();
      setLocalStatus(s);
      setLoadError(null);
    } catch (e: unknown) {
      setLoadError(String(e));
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await llmGetSettings();
      setSettings(s);
      setActiveProvider(s.provider as ProviderTab);
      setSelectedModel((prev) => ({
        ...prev,
        claude: s.claudeModel ?? 'claude-sonnet-4-6',
        openai: s.openaiModel ?? 'gpt-4o',
        gemini: s.geminiModel ?? 'gemini-2.0-flash',
        local: s.localModel ?? prev.local,
      }));
    } catch {}
  }, []);

  const refreshHasKey = useCallback(async (tab: ProviderTab) => {
    if (tab === 'local') return;
    try {
      const ok = await keychainHasToken(`llm-apikey-${tab}`);
      setHasKey((prev) => ({ ...prev, [tab]: ok }));
    } catch {}
  }, []);

  useEffect(() => {
    refreshLocal();
    refreshSettings();
  }, [refreshLocal, refreshSettings]);

  useEffect(() => {
    refreshHasKey(activeTab);
  }, [activeTab, refreshHasKey]);

  const installedNames = useMemo(
    () => new Set(localStatus?.models.map((m) => m.name) ?? []),
    [localStatus],
  );

  const beginServerDownload = useCallback(async () => {
    if (
      serverDownload &&
      serverDownload.status !== 'failed' &&
      serverDownload.status !== 'finished'
    )
      return;
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
              ? { ...prev, downloaded: event.data.downloaded, total: event.data.total, status: 'progress' }
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
      await refreshLocal();
    } catch (e: unknown) {
      setServerDownload((prev) =>
        prev ? { ...prev, status: 'failed', message: String(e) } : prev,
      );
    }
  }, [serverDownload, refreshLocal]);

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
                ? { ...prev, downloaded: event.data.downloaded, total: event.data.total, status: 'progress' }
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
        await refreshLocal();
      } catch (e: unknown) {
        setDownload((prev) =>
          prev && prev.fileName === entry.fileName
            ? { ...prev, status: 'failed', message: String(e) }
            : prev,
        );
      }
    },
    [download, refreshLocal],
  );

  const handleSaveApiKey = useCallback(
    async (tab: ProviderTab) => {
      const key = apiKey[tab].trim();
      if (!key) return;
      setSavingKey(true);
      try {
        await keychainSetToken(`llm-apikey-${tab}`, key);
        setApiKey((prev) => ({ ...prev, [tab]: '' }));
        await refreshHasKey(tab);
      } catch (e: unknown) {
        alert(String(e));
      } finally {
        setSavingKey(false);
      }
    },
    [apiKey, refreshHasKey],
  );

  const handleTestConnection = useCallback(
    async (tab: ProviderTab) => {
      setTestRunning((prev) => ({ ...prev, [tab]: true }));
      setTestResult((prev) => ({ ...prev, [tab]: null }));
      try {
        const key = await llmGetApiKey(tab);
        if (!key) throw new Error('API 키가 없습니다. 먼저 저장하세요.');
        const model = selectedModel[tab];
        let result = '';
        if (tab === 'claude') {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model,
              max_tokens: 5,
              messages: [{ role: 'user', content: 'ping' }],
            }),
          });
          if (!res.ok) {
            const err = await res.text().catch(() => res.statusText);
            throw new Error(`Claude API error ${res.status}: ${err}`);
          }
          result = '연결됨';
        } else if (tab === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 5,
            }),
          });
          if (!res.ok) {
            const err = await res.text().catch(() => res.statusText);
            throw new Error(`OpenAI API error ${res.status}: ${err}`);
          }
          result = '연결됨';
        } else if (tab === 'gemini') {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
                generationConfig: { maxOutputTokens: 5 },
              }),
            },
          );
          if (!res.ok) {
            const err = await res.text().catch(() => res.statusText);
            throw new Error(`Gemini API error ${res.status}: ${err}`);
          }
          result = '연결됨';
        }
        setTestResult((prev) => ({ ...prev, [tab]: result }));
      } catch (e: unknown) {
        setTestResult((prev) => ({ ...prev, [tab]: `오류: ${String(e)}` }));
      } finally {
        setTestRunning((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [selectedModel],
  );

  const handleActivate = useCallback(
    async (tab: ProviderTab) => {
      setActivating(true);
      try {
        const newSettings: LlmSettings = {
          provider: tab,
          localModel: tab === 'local' ? (selectedLocalModel ?? settings?.localModel ?? null) : (settings?.localModel ?? null),
          claudeModel: tab === 'claude' ? selectedModel.claude : (settings?.claudeModel ?? 'claude-sonnet-4-6'),
          openaiModel: tab === 'openai' ? selectedModel.openai : (settings?.openaiModel ?? 'gpt-4o'),
          geminiModel: tab === 'gemini' ? selectedModel.gemini : (settings?.geminiModel ?? 'gemini-2.0-flash'),
        };
        await llmSaveSettings(newSettings);
        resetLLMProvider();
        await loadLLMProvider();
        await refreshSettings();
      } catch (e: unknown) {
        alert(String(e));
      } finally {
        setActivating(false);
      }
    },
    [selectedLocalModel, selectedModel, settings, refreshSettings],
  );

  const tabs: { id: ProviderTab; label: string }[] = [
    { id: 'local', label: '로컬 LLM' },
    { id: 'claude', label: 'Claude' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'gemini', label: 'Gemini' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 현재 활성 공급자 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 8,
        }}
      >
        <StatusDot tone="ok" />
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>현재 활성 공급자:</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
          {activeProvider === 'local'
            ? '로컬 LLM'
            : activeProvider === 'claude'
              ? 'Claude'
              : activeProvider === 'openai'
                ? 'OpenAI'
                : 'Gemini'}
        </span>
      </div>

      {/* 탭 버튼 */}
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid transparent',
              background: activeTab === tab.id ? 'var(--ink)' : 'var(--bg-soft)',
              color: activeTab === tab.id ? 'var(--on-accent)' : 'var(--ink-soft)',
              fontSize: 12.5,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 120ms',
            }}
          >
            {tab.label}
            {activeProvider === tab.id && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 10,
                  color: activeTab === tab.id ? 'var(--on-accent)' : 'var(--ok)',
                }}
              >
                ●
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'local' && (
        <LocalTab
          localStatus={localStatus}
          loadError={loadError}
          serverDownload={serverDownload}
          download={download}
          installedNames={installedNames}
          selectedLocalModel={selectedLocalModel}
          onSelectModel={setSelectedLocalModel}
          onRefresh={refreshLocal}
          onServerDownload={beginServerDownload}
          onModelDownload={beginDownload}
          onActivate={() => handleActivate('local')}
          activating={activating}
          isActive={activeProvider === 'local'}
        />
      )}

      {activeTab !== 'local' && (
        <ApiTab
          tab={activeTab}
          models={
            activeTab === 'claude'
              ? CLAUDE_MODELS
              : activeTab === 'openai'
                ? OPENAI_MODELS
                : GEMINI_MODELS
          }
          apiKey={apiKey[activeTab]}
          hasKey={hasKey[activeTab]}
          selectedModel={selectedModel[activeTab]}
          testResult={testResult[activeTab]}
          testRunning={testRunning[activeTab]}
          savingKey={savingKey}
          activating={activating}
          isActive={activeProvider === activeTab}
          onApiKeyChange={(v) => setApiKey((prev) => ({ ...prev, [activeTab]: v }))}
          onModelChange={(v) => setSelectedModel((prev) => ({ ...prev, [activeTab]: v }))}
          onSaveKey={() => handleSaveApiKey(activeTab)}
          onTest={() => handleTestConnection(activeTab)}
          onActivate={() => handleActivate(activeTab)}
        />
      )}
    </div>
  );
}

interface LocalTabProps {
  localStatus: LlmStatus | null;
  loadError: string | null;
  serverDownload: DownloadState | null;
  download: DownloadState | null;
  installedNames: Set<string>;
  selectedLocalModel: string | null;
  onSelectModel: (name: string) => void;
  onRefresh: () => void;
  onServerDownload: () => void;
  onModelDownload: (entry: ModelEntry) => void;
  onActivate: () => void;
  activating: boolean;
  isActive: boolean;
}

function LocalTab({
  localStatus,
  loadError,
  serverDownload,
  download,
  installedNames,
  selectedLocalModel,
  onSelectModel,
  onRefresh,
  onServerDownload,
  onModelDownload,
  onActivate,
  activating,
  isActive,
}: LocalTabProps) {
  const installedModels = localStatus?.models ?? [];
  const effectiveSelected = selectedLocalModel ?? installedModels[0]?.name ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {loadError && (
        <div
          style={{
            padding: 10,
            borderRadius: 6,
            background: 'var(--err-soft)',
            color: 'var(--err)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
          }}
        >
          {loadError}
        </div>
      )}

      <BinarySection
        status={localStatus}
        download={serverDownload}
        onDownload={onServerDownload}
        onRefresh={onRefresh}
      />

      <div>
        <Eyebrow>2 — 모델 선택</Eyebrow>
        <p style={{ margin: '6px 0 10px', color: 'var(--ink-soft)', fontSize: 12.5 }}>
          하나만 받아도 동작합니다. 나중에 여러 개 추가 가능.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATALOG.map((entry) => (
            <ModelRow
              key={entry.fileName}
              entry={entry}
              installed={installedNames.has(entry.fileName)}
              download={download && download.fileName === entry.fileName ? download : null}
              onDownload={() => onModelDownload(entry)}
            />
          ))}
        </div>
      </div>

      {installedModels.length > 0 && (
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>3 — 사용할 모델</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {installedModels.map((m) => (
              <label
                key={m.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  border: `1px solid ${effectiveSelected === m.name ? 'var(--ink)' : 'var(--line)'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: effectiveSelected === m.name ? 'var(--bg-soft)' : 'var(--bg)',
                }}
              >
                <input
                  type="radio"
                  name="local-model"
                  value={m.name}
                  checked={effectiveSelected === m.name}
                  onChange={() => onSelectModel(m.name)}
                  style={{ accentColor: 'var(--ink)', margin: 0 }}
                />
                <span style={{ fontSize: 12.5, color: 'var(--ink)', flex: 1 }}>{m.name}</span>
                <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                  {formatBytes(m.size)}
                </Mono>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button
          onClick={onActivate}
          disabled={activating || installedModels.length === 0 || !localStatus?.binPresent}
        >
          {activating ? '적용 중…' : isActive ? '활성됨' : '활성화'}
        </Button>
        {isActive && <StatusDot tone="ok" />}
        {isActive && (
          <span style={{ fontSize: 12, color: 'var(--ok)' }}>현재 이 공급자가 사용 중입니다</span>
        )}
      </div>
    </div>
  );
}

interface ApiTabProps {
  tab: ProviderTab;
  models: string[];
  apiKey: string;
  hasKey: boolean;
  selectedModel: string;
  testResult: string | null;
  testRunning: boolean;
  savingKey: boolean;
  activating: boolean;
  isActive: boolean;
  onApiKeyChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onSaveKey: () => void;
  onTest: () => void;
  onActivate: () => void;
}

function ApiTab({
  tab,
  models,
  apiKey,
  hasKey,
  selectedModel,
  testResult,
  testRunning,
  savingKey,
  activating,
  isActive,
  onApiKeyChange,
  onModelChange,
  onSaveKey,
  onTest,
  onActivate,
}: ApiTabProps) {
  const providerLabel =
    tab === 'claude' ? 'Claude' : tab === 'openai' ? 'OpenAI' : 'Gemini';
  const isTestOk = testResult === '연결됨';
  const isTestErr = testResult !== null && testResult !== '연결됨';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow style={{ marginBottom: 8 }}>1 — API 키</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasKey && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <StatusDot tone="ok" />
              <span style={{ fontSize: 12, color: 'var(--ok)' }}>API 키 저장됨</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            placeholder={hasKey ? '새 키로 교체하려면 입력' : `${providerLabel} API 키 입력`}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: 5,
              border: '1px solid var(--line)',
              background: 'var(--bg-input)',
              color: 'var(--ink)',
              fontSize: 12.5,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <Button sm onClick={onSaveKey} disabled={savingKey || !apiKey.trim()}>
            {savingKey ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>

      <div>
        <Eyebrow style={{ marginBottom: 8 }}>2 — 모델</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {models.map((m) => (
            <label
              key={m}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                border: `1px solid ${selectedModel === m ? 'var(--ink)' : 'var(--line)'}`,
                borderRadius: 6,
                cursor: 'pointer',
                background: selectedModel === m ? 'var(--bg-soft)' : 'var(--bg)',
              }}
            >
              <input
                type="radio"
                name={`${tab}-model`}
                value={m}
                checked={selectedModel === m}
                onChange={() => onModelChange(m)}
                style={{ accentColor: 'var(--ink)', margin: 0 }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--ink)', flex: 1, fontFamily: 'var(--font-mono)' }}>
                {m}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow style={{ marginBottom: 8 }}>3 — 연결 테스트</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button sm ghost onClick={onTest} disabled={testRunning || !hasKey}>
            {testRunning ? '테스트 중…' : '연결 테스트'}
          </Button>
          {isTestOk && (
            <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <StatusDot tone="ok" /> 연결됨
            </span>
          )}
          {isTestErr && (
            <span style={{ fontSize: 11.5, color: 'var(--err)', fontFamily: 'var(--font-mono)' }}>
              {testResult}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button onClick={onActivate} disabled={activating || !hasKey}>
          {activating ? '적용 중…' : isActive ? '활성됨' : '활성화'}
        </Button>
        {isActive && <StatusDot tone="ok" />}
        {isActive && (
          <span style={{ fontSize: 12, color: 'var(--ok)' }}>현재 이 공급자가 사용 중입니다</span>
        )}
      </div>
    </div>
  );
}

interface LLMSetupProps {
  onDismiss?: () => void;
}

export function LLMSetup({ onDismiss }: LLMSetupProps) {
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
        padding: 'calc(var(--gap-lg) * 2.5)',
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
            <Eyebrow style={{ marginBottom: 4 }}>LLM 설정</Eyebrow>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
              AI 공급자 선택
            </h2>
          </div>
          {onDismiss && (
            <Button ghost sm onClick={onDismiss}>
              나중에
            </Button>
          )}
        </header>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          <LLMSetupContent />
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
