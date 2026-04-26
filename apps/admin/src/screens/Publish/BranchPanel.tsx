import type { GitState } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

export function BranchPanel({ state }: { state: GitState }) {
  return (
    <div
      style={{
        marginTop: 4,
        padding: '12px 14px',
        border: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        borderRadius: 8,
        display: 'flex',
        gap: 18,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <Field label="브랜치">
        <Mono style={{ fontSize: 13, color: 'var(--ink)' }}>{state.branch}</Mono>
      </Field>
      <Field label="원격">
        {state.upstream ? (
          <Mono style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{state.upstream}</Mono>
        ) : (
          <Mono style={{ fontSize: 12, color: 'var(--ink-faint)' }}>(없음)</Mono>
        )}
      </Field>
      <Field label="앞">
        <Counter n={state.ahead} tone={state.ahead > 0 ? 'ok' : 'mute'} />
      </Field>
      <Field label="뒤">
        <Counter n={state.behind} tone={state.behind > 0 ? 'warn' : 'mute'} />
      </Field>
      {state.lastCommit && (
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            {state.lastCommit.hash}
          </Mono>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--ink-soft)',
              maxWidth: 360,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={state.lastCommit.subject}
          >
            {state.lastCommit.subject}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Counter({ n, tone }: { n: number; tone: 'ok' | 'warn' | 'mute' }) {
  const color =
    tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--ink-mute)';
  return (
    <Mono style={{ fontSize: 13, color, fontWeight: 600 }}>{n}</Mono>
  );
}
