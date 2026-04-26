import { useEffect, useMemo, useState } from 'react';
import type { DocSummary } from '@vallista/content-core';
import { listDocs } from '../../lib/tauri';
import { PageHead } from '../../components/atoms/Atoms';
import { DocList } from './DocList';
import { Editor } from './Editor';
import { RightPane } from './RightPane';
import { DocProvider } from './state';
import { LibraryRail, type StateFilter } from './LibraryRail';

export function Atelier() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [folder, setFolder] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  const collectionByPath = useMemo(() => {
    const map = new Map<string, 'articles' | 'notes'>();
    docs?.forEach((d) => map.set(d.path, d.collection));
    return map;
  }, [docs]);

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

  const collection = selectedPath
    ? collectionByPath.get(selectedPath) ?? 'articles'
    : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '192px 290px 1fr 320px',
        height: '100%',
        minHeight: 0,
      }}
    >
      <LibraryRail
        docs={docs}
        filter={stateFilter}
        folder={folder}
        tag={tag}
        onFilter={setStateFilter}
        onFolder={setFolder}
        onTag={setTag}
      />
      <DocList
        docs={docs}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
        stateFilter={stateFilter}
        folder={folder}
        tag={tag}
      />
      {selectedPath && collection ? (
        <DocProvider key={selectedPath} path={selectedPath}>
          <Editor />
          <RightPane collection={collection} />
        </DocProvider>
      ) : (
        <>
          <EmptyCenter />
          <EmptyRight />
        </>
      )}
    </div>
  );
}

function EmptyCenter() {
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

function EmptyRight() {
  return (
    <div
      style={{
        borderLeft: '1px solid var(--line)',
        background: 'var(--bg-soft)',
      }}
    />
  );
}
