import { useState } from 'react';

type Props = {
  canCommit: boolean;
  canPush: boolean;
  defaultPush: boolean;
  pushing: boolean;
  onSubmit: (message: string, push: boolean) => Promise<void>;
};

export function CommitBox({ canCommit, canPush, defaultPush, pushing, onSubmit }: Props) {
  const [message, setMessage] = useState('');
  const [push, setPush] = useState(defaultPush);

  const submit = async () => {
    const m = message.trim();
    if (!m) return;
    await onSubmit(m, push && canPush);
    setMessage('');
  };

  const ready = canCommit && message.trim().length > 0;

  return (
    <section style={{ marginTop: 18 }}>
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
          커밋 메시지
        </h2>
      </header>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="예) feat(blog): X 게시 + 표지 정리"
        rows={3}
        disabled={pushing}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (ready) submit();
          }
        }}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--line)',
          background: 'var(--bg-input, var(--bg))',
          color: 'var(--ink)',
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          gap: 12,
        }}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: canPush ? 'var(--ink-soft)' : 'var(--ink-faint)',
            cursor: canPush ? 'pointer' : 'not-allowed',
          }}
          title={canPush ? '커밋 후 origin으로 푸시' : '브랜치에 upstream이 없거나 main이 아니면 비활성'}
        >
          <input
            type="checkbox"
            checked={push && canPush}
            disabled={!canPush || pushing}
            onChange={(e) => setPush(e.target.checked)}
          />
          푸시까지 한 번에
        </label>
        <button
          onClick={submit}
          disabled={!ready}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid var(--ink)',
            background: ready ? 'var(--ink)' : 'transparent',
            color: ready ? 'var(--on-accent)' : 'var(--ink-mute)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: ready ? 'pointer' : 'not-allowed',
          }}
        >
          {pushing ? '진행 중…' : push && canPush ? '커밋 + 푸시' : '커밋만'}
        </button>
      </div>
    </section>
  );
}
