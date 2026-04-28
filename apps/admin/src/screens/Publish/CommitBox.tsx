import { useState } from 'react';
import { Checkbox, Textarea } from '../../components/atoms/Atoms';

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
      <Textarea
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
        <Checkbox
          checked={push && canPush}
          disabled={!canPush || pushing}
          onChange={setPush}
          title={canPush ? '커밋 후 origin으로 푸시' : '브랜치에 upstream이 없거나 main이 아니면 비활성'}
          style={{ color: canPush ? 'var(--ink-soft)' : 'var(--ink-faint)' }}
        >
          푸시까지 한 번에
        </Checkbox>
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
