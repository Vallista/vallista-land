import { useEffect, useState } from 'react';
import type { Summary } from '@vallista/content-core';
import { Button, Mono } from './atoms/Atoms';

interface SummaryModalProps {
  summary: Summary;
  onClose: () => void | Promise<void>;
  onRegenerate?: () => Promise<void>;
}

function periodLabel(s: Summary): string {
  if (s.kind === 'weekly') return `지난 주 정리 · ${s.period}`;
  return `지난 달 정리 · ${s.period}`;
}

function generatedAtLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}`;
}

export function SummaryModal({ summary, onClose, onRegenerate }: SummaryModalProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const regenerate = async () => {
    if (!onRegenerate) return;
    setBusy(true);
    try {
      await onRegenerate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.46)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 220,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 92vw)',
          maxHeight: '78vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          boxShadow: '0 22px 64px rgba(0,0,0,0.34)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Mono
              style={{
                fontSize: 10.5,
                color: 'var(--blue)',
                letterSpacing: '0.06em',
              }}
            >
              자동 정리 · LLM
            </Mono>
            <span style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 600 }}>
              {periodLabel(summary)}
            </span>
          </div>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            {generatedAtLabel(summary.generatedAt)}
            {summary.model ? ` · ${summary.model}` : ''}
          </Mono>
        </div>

        <div
          className="psm-selectable"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            fontSize: 14,
            lineHeight: 1.78,
            color: 'var(--ink)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {summary.text}
        </div>

        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          {onRegenerate && (
            <Button sm ghost onClick={regenerate} disabled={busy}>
              {busy ? '생성 중…' : '다시 생성'}
            </Button>
          )}
          <Button sm onClick={() => onClose()} disabled={busy}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
