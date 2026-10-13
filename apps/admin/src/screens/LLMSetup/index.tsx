import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  keychainDeleteToken,
  keychainHasToken,
  keychainSetToken,
  llmChat,
  llmGetSettings,
  llmSaveSettings,
  openUrl,
} from '../../lib/tauri';
import { CLAUDE_KEY_REMOTE, CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL } from '../../lib/llm';
import { Button, Eyebrow, Mono, StatusDot } from '../../components/atoms/Atoms';

const CONSOLE_KEYS_URL = 'https://console.anthropic.com/settings/keys';

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '7px 10px',
  borderRadius: 5,
  border: '1px solid var(--line)',
  background: 'var(--bg-input)',
  color: 'var(--ink)',
  fontSize: 12.5,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
};

export function LLMSetupContent() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [model, setModel] = useState(DEFAULT_CLAUDE_MODEL);
  const [savingModel, setSavingModel] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    keychainHasToken(CLAUDE_KEY_REMOTE)
      .then((ok) => {
        if (!cancelled) setHasKey(ok);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(String(e));
      });
    llmGetSettings()
      .then((s) => {
        if (!cancelled) setModel(s.claudeModel || DEFAULT_CLAUDE_MODEL);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    };
  }, []);

  const saveKey = async () => {
    const key = apiKey.trim();
    if (!key) return;
    setSavingKey(true);
    setError(null);
    try {
      await keychainSetToken(CLAUDE_KEY_REMOTE, key);
      setApiKey('');
      setTestResult(null);
      setHasKey(true);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSavingKey(false);
    }
  };

  const deleteKey = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    setConfirmDelete(false);
    setError(null);
    try {
      await keychainDeleteToken(CLAUDE_KEY_REMOTE);
      setHasKey(false);
      setTestResult(null);
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const changeModel = async (next: string) => {
    if (next === model || savingModel) return;
    const prev = model;
    setModel(next);
    setSavingModel(true);
    setError(null);
    try {
      await llmSaveSettings({ claudeModel: next });
    } catch (e: unknown) {
      setModel(prev);
      setError(String(e));
    } finally {
      setSavingModel(false);
    }
  };

  const testConnection = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      await llmChat({ messages: [{ role: 'user', content: 'ping' }], maxTokens: 5 });
      setTestResult('연결됨');
    } catch (e: unknown) {
      setTestResult(`오류: ${String(e)}`);
    } finally {
      setTestRunning(false);
    }
  };

  const isTestOk = testResult === '연결됨';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <StatusDot
          tone={hasKey ? 'ok' : hasKey === null ? 'mute' : 'warn'}
          pulse={hasKey === null}
        />
        <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>
          {hasKey === null ? '확인 중…' : hasKey ? 'Claude API 키 저장됨' : 'Claude API 키 없음'}
        </span>
        <span style={{ flex: 1 }} />
        <Button sm ghost onClick={() => void openUrl(CONSOLE_KEYS_URL)}>
          Console에서 키 발급 ↗
        </Button>
      </div>

      <div>
        <Eyebrow style={{ marginBottom: 8 }}>1 — API 키</Eyebrow>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            placeholder={hasKey ? '새 키로 교체하려면 입력' : 'sk-ant-… 형식의 키 입력'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveKey();
            }}
            style={inputStyle}
          />
          <Button sm onClick={() => void saveKey()} disabled={savingKey || !apiKey.trim()}>
            {savingKey ? '저장 중…' : '저장'}
          </Button>
          {hasKey && (
            <Button sm ghost danger={confirmDelete} onClick={() => void deleteKey()}>
              {confirmDelete ? '정말 삭제?' : '삭제'}
            </Button>
          )}
        </div>
        <Mono style={{ display: 'block', marginTop: 6, fontSize: 10.5, color: 'var(--ink-mute)' }}>
          키는 macOS 키체인에만 저장되고 앱 내부에서만 읽습니다. 사용량은 Console 크레딧에서
          차감됩니다.
        </Mono>
      </div>

      <div>
        <Eyebrow style={{ marginBottom: 8 }}>2 — 모델</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CLAUDE_MODELS.map((m) => {
            const selected = model === m.id;
            return (
              <label
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  border: `1px solid ${selected ? 'var(--ink)' : 'var(--line)'}`,
                  borderRadius: 6,
                  cursor: savingModel ? 'progress' : 'pointer',
                  background: selected ? 'var(--bg-soft)' : 'var(--bg)',
                }}
              >
                <input
                  type="radio"
                  name="claude-model"
                  value={m.id}
                  checked={selected}
                  disabled={savingModel}
                  onChange={() => void changeModel(m.id)}
                  style={{ accentColor: 'var(--ink)', margin: 0 }}
                />
                <span
                  style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: selected ? 600 : 400 }}
                >
                  {m.label}
                </span>
                <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{m.id}</Mono>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{m.hint}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Eyebrow style={{ marginBottom: 8 }}>3 — 연결 테스트</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button sm ghost onClick={() => void testConnection()} disabled={testRunning || !hasKey}>
            {testRunning ? '테스트 중…' : '연결 테스트'}
          </Button>
          {isTestOk && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--ok)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <StatusDot tone="ok" /> 연결됨
            </span>
          )}
          {testResult && !isTestOk && (
            <span style={{ fontSize: 11.5, color: 'var(--err)', fontFamily: 'var(--font-mono)' }}>
              {testResult}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 11.5, color: 'var(--err)', fontFamily: 'var(--font-mono)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
