import { useState } from 'react';
import { Button, Mono } from '../../components/atoms/Atoms';
import { useLLMWake } from '../../components/LLMWakeModal';
import {
  continueWriting,
  improveText,
  runSpellCheck,
  suggestMeta,
  suggestReferences,
} from './writingAssist';

type JobKind = 'spellcheck' | 'continue' | 'improve' | 'references' | 'meta';

type ApplyMode = 'replace-all' | 'append' | 'replace-selection';

interface Props {
  body: string;
  selection: string;
  onApply: (text: string, mode: ApplyMode) => void;
  onClose: () => void;
}

const JOB_LABELS: Record<JobKind, string> = {
  spellcheck: '맞춤법 교정',
  continue: '글 이어쓰기',
  improve: '선택 단락 개선',
  references: '참고 자료 제안',
  meta: '제목·태그 제안',
};

const JOB_DESC: Record<JobKind, string> = {
  spellcheck: '전체 글의 맞춤법과 문체를 교정합니다',
  continue: '현재 글 뒤에 이어지는 단락을 생성합니다',
  improve: '선택한 텍스트를 더 명확하게 개선합니다',
  references: '글 주제에 맞는 참고 자료를 제안합니다',
  meta: '제목·설명·태그 초안을 생성합니다',
};

export function WritingAssistPanel({ body, selection, onApply, onClose }: Props) {
  const wake = useLLMWake();
  const [activeJob, setActiveJob] = useState<JobKind | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function runJob(kind: JobKind) {
    await wake.run(async () => {
      setActiveJob(kind);
      setResult(null);
      setError(null);
      setLoading(true);
      try {
        let res: string;
        if (kind === 'spellcheck') {
          res = await runSpellCheck(body);
        } else if (kind === 'continue') {
          res = await continueWriting(body);
        } else if (kind === 'improve') {
          if (!selection) {
            setError('에디터에서 개선할 텍스트를 먼저 선택하세요.');
            return;
          }
          const selStart = body.indexOf(selection);
          const context = selStart > 0 ? body.slice(0, selStart) : body;
          res = await improveText(selection, context);
        } else if (kind === 'references') {
          res = await suggestReferences(body);
        } else {
          res = await suggestMeta(body);
        }
        setResult(res);
      } catch (e: unknown) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    });
  }

  function handleApply() {
    if (!result || !activeJob) return;
    const mode: ApplyMode =
      activeJob === 'spellcheck' ? 'replace-all' :
      activeJob === 'continue' ? 'append' :
      'replace-selection';
    onApply(result, mode);
  }

  function handleCopy() {
    if (!result) return;
    void navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {wake.modal}
      <div
        style={{
          width: 340,
          borderLeft: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '12px 16px 11px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Mono style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 600, letterSpacing: '0.05em' }}>
          AI 글쓰기 보조
        </Mono>
        <button
          onClick={onClose}
          title="닫기"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-mute)',
            padding: '2px 4px',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* 기능 목록 */}
      <div
        style={{
          padding: '10px 10px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {(Object.keys(JOB_LABELS) as JobKind[]).map((kind) => {
          const needsSelection = kind === 'improve';
          const disabled = loading || (needsSelection && !selection);
          return (
            <button
              key={kind}
              onClick={() => void runJob(kind)}
              disabled={disabled}
              style={{
                padding: '9px 12px',
                background: activeJob === kind ? 'var(--bg-shade)' : 'transparent',
                border: `1px solid ${activeJob === kind ? 'var(--line-strong)' : 'var(--line)'}`,
                borderRadius: 6,
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                opacity: disabled ? 0.45 : 1,
                transition: 'background 100ms',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                {JOB_LABELS[kind]}
              </div>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', display: 'block' }}>
                {kind === 'improve' && !selection
                  ? '텍스트를 선택하면 활성화됩니다'
                  : JOB_DESC[kind]}
              </Mono>
            </button>
          );
        })}
      </div>

      {/* 결과 영역 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '12px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-mute)',
              fontSize: 12,
            }}
          >
            생성 중…
          </div>
        )}

        {!loading && error && (
          <Mono
            style={{
              fontSize: 11,
              color: 'var(--err)',
              padding: 10,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {error}
          </Mono>
        )}

        {!loading && result && (
          <>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: 12,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                fontSize: 12.5,
                lineHeight: 1.75,
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {result}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                sm
                onClick={handleCopy}
                style={{ flex: 1 }}
              >
                {copied ? '복사됨' : '복사'}
              </Button>
              {(activeJob === 'spellcheck' ||
                activeJob === 'continue' ||
                activeJob === 'improve') && (
                <Button
                  sm
                  onClick={handleApply}
                  style={{ flex: 1, background: 'var(--blue)', color: '#fff', border: 'none' }}
                >
                  {activeJob === 'spellcheck'
                    ? '전체 교체'
                    : activeJob === 'continue'
                      ? '뒤에 삽입'
                      : '선택 교체'}
                </Button>
              )}
            </div>
          </>
        )}

        {!loading && !result && !error && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-faint)',
              fontSize: 12,
              textAlign: 'center',
              padding: '0 16px',
            }}
          >
            위 기능을 선택하면 결과가 여기에 표시됩니다
          </div>
        )}
      </div>
    </div>
    </>
  );
}
