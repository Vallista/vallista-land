import { useEffect, useState } from 'react';
import { Button, Mono, StatusDot } from '../../components/atoms/Atoms';
import { useLLMWake } from '../../components/LLMWakeModal';
import {
  llmChat,
  mailDeleteMessage,
  mailGetMessage,
  mailSetFlagged,
  mailSetSeen,
  type MailMessageFull,
} from '../../lib/tauri';

function formatFullDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MailDetail({
  accountId,
  folder,
  uid,
  onDeleted,
  onPatch,
  onUnreadDelta,
}: {
  accountId: string;
  folder: string;
  uid: number;
  onDeleted: (uid: number) => void;
  onPatch: (uid: number, changes: { seen?: boolean; flagged?: boolean }, folder: string, accountId: string) => void;
  onUnreadDelta?: (accountId: string, folder: string, delta: number) => void;
}) {
  const wake = useLLMWake();
  const [msg, setMsg] = useState<MailMessageFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'summary' | 'actions' | 'draft' | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [actions, setActions] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [actionsErr, setActionsErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMsg(null);
    setActivePanel(null);
    setSummary(null);
    setSummaryErr(null);
    setActions(null);
    setActionsErr(null);
    setDraft(null);
    setDraftErr(null);
    setError(null);
    let cancelled = false;
    setLoading(true);
    mailGetMessage(accountId, folder, uid)
      .then((m) => {
        if (cancelled) return;
        setMsg(m);
        onPatch(uid, { seen: true }, folder, accountId);
        if (!m.seen) {
          mailSetSeen(accountId, folder, uid, true)
            .then(() => {
              if (!cancelled) {
                window.dispatchEvent(
                  new CustomEvent('bento:mail-seen-changed', { detail: { accountId } }),
                );
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, folder, uid]);

  const handleToggleFlag = async () => {
    if (!msg) return;
    const next = !msg.flagged;
    setMsg((prev) => (prev ? { ...prev, flagged: next } : prev));
    try {
      await mailSetFlagged(accountId, folder, uid, next);
      onPatch(uid, { flagged: next }, folder, accountId);
    } catch {
      setMsg((prev) => (prev ? { ...prev, flagged: !next } : prev));
    }
  };

  const handleToggleSeen = async () => {
    if (!msg) return;
    const next = !msg.seen;
    setMsg((prev) => (prev ? { ...prev, seen: next } : prev));
    try {
      await mailSetSeen(accountId, folder, uid, next);
      onPatch(uid, { seen: next }, folder, accountId);
      onUnreadDelta?.(accountId, folder, next ? -1 : 1);
      window.dispatchEvent(new CustomEvent('bento:mail-seen-changed', { detail: { accountId } }));
    } catch {
      setMsg((prev) => (prev ? { ...prev, seen: !next } : prev));
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm('이 메일을 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await mailDeleteMessage(accountId, folder, uid);
      onDeleted(uid);
    } catch (err) {
      alert(String(err));
      setDeleting(false);
    }
  };

  const getBodyText = (m: MailMessageFull) =>
    m.bodyText || m.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const handleSummarize = async () => {
    if (!msg || summarizing) return;
    setActivePanel('summary');
    if (summary) return;
    await wake.run(async () => {
      setSummarizing(true);
      setSummaryErr(null);
      try {
        const result = await llmChat({
          messages: [
            {
              role: 'system',
              content:
                '다음 이메일을 한국어로 3-5줄로 간결하게 요약하세요. 핵심 내용과 필요한 행동(action item)이 있으면 별도로 표시하세요.',
            },
            { role: 'user', content: `제목: ${msg.subject}\n\n${getBodyText(msg)}` },
          ],
          maxTokens: 512,
        });
        setSummary(result);
      } catch (err) {
        setSummaryErr(String(err));
      } finally {
        setSummarizing(false);
      }
    });
  };

  const handleExtractActions = async () => {
    if (!msg || extracting) return;
    setActivePanel('actions');
    if (actions) return;
    await wake.run(async () => {
      setExtracting(true);
      setActionsErr(null);
      try {
        const result = await llmChat({
          messages: [
            {
              role: 'system',
              content:
                '이메일에서 수신자가 해야 할 action item만 추출하세요. 번호 매긴 목록으로 작성하고, 없으면 "없음"이라고만 답하세요. 한국어로 답하세요.',
            },
            { role: 'user', content: `제목: ${msg.subject}\n\n${getBodyText(msg)}` },
          ],
          maxTokens: 400,
        });
        setActions(result);
      } catch (err) {
        setActionsErr(String(err));
      } finally {
        setExtracting(false);
      }
    });
  };

  const handleDraftReply = async () => {
    if (!msg || drafting) return;
    setActivePanel('draft');
    if (draft) return;
    await wake.run(async () => {
      setDrafting(true);
      setDraftErr(null);
      try {
        const result = await llmChat({
          messages: [
            {
              role: 'system',
              content:
                '다음 이메일에 대한 간결하고 정중한 답장 초안을 한국어로 작성하세요. 인사말, 핵심 답변, 마무리 인사만 포함하세요. 서명란은 [서명] 으로 남겨두세요.',
            },
            {
              role: 'user',
              content: `보낸 사람: ${msg.from}\n제목: ${msg.subject}\n\n${getBodyText(msg)}`,
            },
          ],
          maxTokens: 600,
        });
        setDraft(result);
      } catch (err) {
        setDraftErr(String(err));
      } finally {
        setDrafting(false);
      }
    });
  };

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: 'var(--gap-lg)', color: 'var(--err)', fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (!msg) return null;

  return (
    <>
      {wake.modal}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
      <div
        style={{
          padding: '12px 28px 10px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.35,
              flex: 1,
            }}
          >
            {msg.subject || '(제목 없음)'}
          </h2>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Button ghost sm onClick={handleToggleSeen} title={msg.seen ? '안읽음으로 표시' : '읽음으로 표시'}>
              {msg.seen ? '◎' : '●'}
            </Button>
            <Button ghost sm onClick={handleToggleFlag} title={msg.flagged ? '중요 해제' : '중요 표시'}>
              {msg.flagged ? '★' : '☆'}
            </Button>
            <Button danger sm onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : '삭제'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MetaRow label="보낸 사람" value={msg.from} />
          {msg.to && <MetaRow label="받는 사람" value={msg.to} />}
          <MetaRow label="날짜" value={formatFullDate(msg.date)} mono />
          {msg.attachments.length > 0 && (
            <MetaRow label="첨부" value={msg.attachments.join(', ')} />
          )}
        </div>
      </div>

      {/* AI 도우미 */}
      <div
        style={{
          padding: '10px 28px',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: activePanel ? 8 : 0 }}>
          <AiTabButton
            label="요약"
            loading={summarizing}
            active={activePanel === 'summary'}
            onClick={handleSummarize}
          />
          <AiTabButton
            label="할 일"
            loading={extracting}
            active={activePanel === 'actions'}
            onClick={handleExtractActions}
          />
          <AiTabButton
            label="답장 초안"
            loading={drafting}
            active={activePanel === 'draft'}
            onClick={handleDraftReply}
          />
          {(summarizing || extracting || drafting) && <StatusDot tone="blue" pulse />}
        </div>

        {activePanel === 'summary' && (
          <AiPanel content={summary} err={summaryErr} loading={summarizing} placeholder="요약 생성 중…" />
        )}
        {activePanel === 'actions' && (
          <AiPanel content={actions} err={actionsErr} loading={extracting} placeholder="할 일 추출 중…" />
        )}
        {activePanel === 'draft' && (
          <AiPanel content={draft} err={draftErr} loading={drafting} placeholder="답장 초안 작성 중…" copyable />
        )}
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 36px', background: '#ffffff' }}>
        {msg.bodyHtml ? (
          <div
            style={{ fontSize: 13, lineHeight: 1.7, color: '#333333' }}
            dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
          />
        ) : (
          <pre
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.7,
              color: '#333333',
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.bodyText || '(본문 없음)'}
          </pre>
        )}
      </div>
    </div>
    </>
  );
}

function AiTabButton({
  label,
  loading,
  active,
  onClick,
}: {
  label: string;
  loading: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      ghost
      sm
      onClick={onClick}
      disabled={loading}
      style={
        active
          ? { background: 'var(--bg-soft)', border: '1px solid var(--line)', fontWeight: 600 }
          : undefined
      }
    >
      {loading ? `${label} 중…` : label}
    </Button>
  );
}

function AiPanel({
  content,
  err,
  loading,
  placeholder,
  copyable,
}: {
  content: string | null;
  err: string | null;
  loading: boolean;
  placeholder: string;
  copyable?: boolean;
}) {
  if (err) return <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{err}</Mono>;
  if (!content && !loading) return null;
  return (
    <div
      style={{
        background: 'var(--bg-soft)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        padding: '10px 12px',
        fontSize: 12.5,
        lineHeight: 1.65,
        color: loading ? 'var(--ink-mute)' : 'var(--ink)',
        whiteSpace: 'pre-wrap',
        position: 'relative',
      }}
    >
      {loading ? placeholder : content}
      {copyable && content && (
        <button
          onClick={() => navigator.clipboard.writeText(content)}
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--ink-mute)',
            padding: '2px 4px',
          }}
          title="클립보드에 복사"
        >
          복사
        </button>
      )}
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', flexShrink: 0, paddingTop: 1 }}>
        {label}
      </Mono>
      <span
        style={{
          color: 'var(--ink-2)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          fontSize: mono ? 11 : 12,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}
