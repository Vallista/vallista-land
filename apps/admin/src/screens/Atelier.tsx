import { useEffect, useState } from 'react';
import { PageHead, Tag, Mono } from '../components/atoms/Atoms';
import { listDocs } from '../lib/tauri';
import type { DocSummary } from '@vallista/content-core';

export function Atelier() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="글방" sub="모든 글의 작업대 — M1에서 3-pane 에디터로 구체화" />
      {error && (
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            marginBottom: 16,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {!docs && !error && <p style={{ color: 'var(--ink-mute)' }}>vault 읽는 중…</p>}
      {docs && (
        <>
          <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
            vault에서 {docs.length}개 문서가 보입니다 (articles + notes). M1에서 3-pane 에디터에 묶입니다.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docs.slice(0, 30).map((d) => (
              <li
                key={d.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  background: 'var(--bg-soft)',
                }}
              >
                <Tag>{d.state}</Tag>
                <span style={{ flex: 1, color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.title || d.slug || d.path}
                </span>
                <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{d.collection}</Mono>
                <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{d.words}w</Mono>
              </li>
            ))}
          </ul>
          {docs.length > 30 && (
            <p style={{ color: 'var(--ink-faint)', fontSize: 11, marginTop: 12, fontFamily: 'var(--font-mono)' }}>
              … {docs.length - 30}개 생략
            </p>
          )}
        </>
      )}
    </div>
  );
}
