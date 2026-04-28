import { useEffect, useMemo, useRef, useState } from 'react';
import type { DocSummary } from '@vallista/content-core';
import { listDocs } from '../../lib/tauri';
import { PageHead } from '../../components/atoms/Atoms';
import { DocList } from './DocList';
import { Editor } from './Editor';
import { RightPane } from './RightPane';
import { DocProvider } from './state';
import { LibraryRail, type StateFilter } from './LibraryRail';

const LS_LEFT = 'bento.atelier.leftCollapsed';
const LS_RIGHT = 'bento.atelier.rightCollapsed';

const FORCE_COLLAPSE_RIGHT_BELOW = 1180;
const FORCE_COLLAPSE_LEFT_BELOW = 880;

export function Atelier() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [folder, setFolder] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() => readLs(LS_LEFT));
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => readLs(LS_RIGHT));
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => writeLs(LS_LEFT, leftCollapsed), [leftCollapsed]);
  useEffect(() => writeLs(LS_RIGHT, rightCollapsed), [rightCollapsed]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(entry.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === '\\' && !e.shiftKey) {
        e.preventDefault();
        setLeftCollapsed((v) => !v);
      } else if (e.key === '\\' && e.shiftKey) {
        e.preventDefault();
        setRightCollapsed((v) => !v);
      } else if (e.key === '.' && !e.shiftKey) {
        e.preventDefault();
        const focusing = !(leftCollapsed && rightCollapsed);
        setLeftCollapsed(focusing);
        setRightCollapsed(focusing);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leftCollapsed, rightCollapsed]);

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

  const forceCollapseRight = width > 0 && width < FORCE_COLLAPSE_RIGHT_BELOW;
  const forceCollapseLeft = width > 0 && width < FORCE_COLLAPSE_LEFT_BELOW;
  const effectiveLeftCollapsed = selectedPath
    ? leftCollapsed || forceCollapseLeft
    : false;
  const effectiveRightCollapsed = rightCollapsed || forceCollapseRight;

  const focusMode = effectiveLeftCollapsed && effectiveRightCollapsed;
  const leftCols = effectiveLeftCollapsed
    ? ''
    : 'clamp(168px, 14vw, 192px) clamp(240px, 22vw, 290px) ';
  const rightCols = effectiveRightCollapsed ? '' : ' clamp(280px, 22vw, 320px)';
  const gridTemplateColumns = `${leftCols}minmax(0, 1fr)${rightCols}`;

  const toggleLeft = () => setLeftCollapsed((v) => !v);
  const toggleRight = () => setRightCollapsed((v) => !v);
  const toggleFocus = () => {
    const next = !focusMode;
    setLeftCollapsed(next);
    setRightCollapsed(next);
  };

  return (
    <div ref={wrapperRef} style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          height: '100%',
          minHeight: 0,
        }}
      >
        {!effectiveLeftCollapsed && (
          <>
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
          </>
        )}
        {selectedPath && collection ? (
          <DocProvider key={selectedPath} path={selectedPath}>
            <Editor
              onToggleLeft={toggleLeft}
              onToggleRight={toggleRight}
              onToggleFocus={toggleFocus}
              leftCollapsed={effectiveLeftCollapsed}
              rightCollapsed={effectiveRightCollapsed}
              focusMode={focusMode}
              rightForced={forceCollapseRight && !rightCollapsed}
              leftForced={forceCollapseLeft && !leftCollapsed}
            />
            {!effectiveRightCollapsed && <RightPane collection={collection} />}
          </DocProvider>
        ) : (
          <>
            <EmptyCenter />
            {!effectiveRightCollapsed && <EmptyRight />}
          </>
        )}
      </div>
    </div>
  );
}

function readLs(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key) === '1';
}

function writeLs(key: string, val: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, val ? '1' : '0');
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
