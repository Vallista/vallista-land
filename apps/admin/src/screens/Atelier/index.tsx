import { useEffect, useState } from 'react';
import type { DocSummary } from '@vallista/content-core';
import { listDocs } from '../../lib/tauri';
import { Mono, PageHead } from '../../components/atoms/Atoms';
import { DocList } from './DocList';

export function Atelier() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="글방" sub="vault 읽기 실패" />
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!docs) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="글방" sub="vault 읽는 중…" />
      </div>
    );
  }

  const selectedDoc = selectedPath ? docs.find((d) => d.path === selectedPath) ?? null : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 360px',
        height: '100%',
        minHeight: 0,
      }}
    >
      <DocList docs={docs} selectedPath={selectedPath} onSelect={setSelectedPath} />
      <EditorStub doc={selectedDoc} path={selectedPath} />
      <RightStub path={selectedPath} />
    </div>
  );
}

function EditorStub({ doc, path }: { doc: DocSummary | null; path: string | null }) {
  if (!path || !doc) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--ink-mute)',
          fontSize: 13,
        }}
      >
        좌측에서 문서를 선택하세요
      </div>
    );
  }
  return (
    <div style={{ padding: '40px 56px', overflow: 'auto' }}>
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>EDITOR · {path}</Mono>
      <h1 style={{ margin: '14px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
        {doc.title || doc.slug || '(제목 없음)'}
      </h1>
      <p style={{ marginTop: 32, color: 'var(--ink-mute)', fontSize: 13 }}>
        에디터는 M1.2에서 들어옵니다 — CodeMirror 6 마크다운 + 디바운스 자동 저장.
      </p>
    </div>
  );
}

function RightStub({ path }: { path: string | null }) {
  if (!path) {
    return (
      <div
        style={{
          borderLeft: '1px solid var(--line)',
          background: 'var(--bg-soft)',
        }}
      />
    );
  }
  return (
    <div
      style={{
        borderLeft: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>META · PREVIEW</Mono>
      <p style={{ fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
        메타 폼은 M1.3, 라이브 프리뷰는 M1.4에서 들어옵니다.
      </p>
    </div>
  );
}
