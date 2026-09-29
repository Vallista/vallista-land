import { useCallback, useState } from 'react';
import { getLLMProvider } from '../lib/llm';
import { llmStatus } from '../lib/tauri';
import { Button, Eyebrow, StatusDot } from './atoms/Atoms';

type WakeState = 'idle' | 'waking' | 'error';

interface LLMWakeModalProps {
  state: Exclude<WakeState, 'idle'>;
  error: string;
  onDismiss: () => void;
}

function LLMWakeModal({ state, error, onDismiss }: LLMWakeModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.52)',
        zIndex: 230,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 'min(440px, 92vw)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '28px 28px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {state === 'waking' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusDot pulse />
              <Eyebrow style={{ margin: 0 }}>LLM 서버 시작 중</Eyebrow>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--fg-sub)' }}>
              로컬 LLM 서버를 활성화하고 있습니다.
              <br />
              처음 실행 시 모델을 메모리에 올리는 데 <strong>30초~1분</strong> 정도 소요될 수 있습니다.
              <br />
              잠시 기다려주세요.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button ghost sm onClick={onDismiss}>
                취소
              </Button>
            </div>
          </>
        ) : (
          <>
            <Eyebrow style={{ margin: 0 }}>서버를 시작하지 못했습니다</Eyebrow>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--fg-sub)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {error}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button ghost sm onClick={onDismiss}>
                닫기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function useLLMWake() {
  const [wakeState, setWakeState] = useState<WakeState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const run = useCallback(async (fn: () => Promise<void>) => {
    const status = await llmStatus();
    if (status.running) {
      await fn();
      return;
    }
    setWakeState('waking');
    setErrorMsg('');
    try {
      await getLLMProvider().ensureRunning();
      setWakeState('idle');
      await fn();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setWakeState('error');
    }
  }, []);

  const dismiss = useCallback(() => {
    setWakeState('idle');
    setErrorMsg('');
  }, []);

  const modal =
    wakeState !== 'idle' ? (
      <LLMWakeModal state={wakeState} error={errorMsg} onDismiss={dismiss} />
    ) : null;

  return { run, modal };
}
