import { useEffect, useState, type ReactNode } from 'react';
import type { DocSummary } from '@vallista/content-core';
import { Button, Mono } from '../../components/atoms/Atoms';
import { deleteDoc, gitStatus, type DeletedDoc, type GitFile } from '../../lib/tauri';
import { useDoc } from './state';

export interface DeletionUnit {
  kind: 'folder' | 'file';
  path: string;
}

const COLLECTION_ROOTS = ['contents/articles', 'contents/notes'];

/** Rust `delete_doc`의 삭제 단위 규칙을 목록 기준으로 미리 계산한다. 최종 판정은 Rust가 한다. */
export function deletionUnit(path: string, docs: DocSummary[]): DeletionUnit {
  const slash = path.lastIndexOf('/');
  const dir = slash >= 0 ? path.slice(0, slash) : '';
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const isIndex = /^index\.mdx?$/.test(name);
  const atRoot = COLLECTION_ROOTS.includes(dir);
  const hasOther = docs.some((d) => d.path !== path && d.path.startsWith(`${dir}/`));
  if (isIndex && !atRoot && !hasOther) return { kind: 'folder', path: `${dir}/` };
  return { kind: 'file', path };
}

/** 블로그 content.config.ts의 glob 패턴 기준으로 빌드 대상인지. */
export function isBuiltByBlog(path: string): boolean {
  if (!path.endsWith('.md')) return false;
  if (path.startsWith('contents/notes/')) return true;
  if (!path.startsWith('contents/articles/')) return false;
  const rest = path.slice('contents/articles/'.length);
  return !rest.includes('/') || rest.endsWith('/index.md');
}

type Tone = 'ink' | 'warn' | 'ok' | 'mute';

export interface GitLine {
  tone: Tone;
  text: string;
}

export function describeGit(files: GitFile[], docPath: string, unit: DeletionUnit): GitLine {
  const nfc = (s: string) => s.normalize('NFC');
  const doc = nfc(docPath);
  const dir = unit.kind === 'folder' ? nfc(unit.path) : null;
  const covers = (p: string) => p === doc || (p.endsWith('/') && doc.startsWith(p));
  const related = files.filter((f) => {
    const p = nfc(f.path);
    return covers(p) || (dir !== null && p.startsWith(dir));
  });
  if (related.some((f) => f.untracked && covers(nfc(f.path)))) {
    return { tone: 'warn', text: 'git에 없는 글 · 복구는 앱 백업뿐' };
  }
  if (related.length > 0) {
    return { tone: 'warn', text: '커밋되지 않은 변경 있음 · git은 마지막 커밋까지만 복구' };
  }
  return { tone: 'ok', text: 'git에 커밋됨 · git checkout으로도 복구 가능' };
}

const GIT_UNKNOWN: GitLine = { tone: 'mute', text: 'git 상태 확인 실패 · 복구는 앱 백업' };

export function DeleteDocDialog({
  docs,
  onCancel,
  onDeleted,
}: {
  docs: DocSummary[];
  onCancel: () => void;
  onDeleted: (path: string, result: DeletedDoc) => void;
}) {
  const { path, status, frontmatter, pauseAutosave, resumeAutosave } = useDoc();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [git, setGit] = useState<GitLine | null>(null);

  const unit = deletionUnit(path, docs);
  const loading = status === 'loading';
  const title =
    typeof frontmatter.title === 'string' && frontmatter.title.trim() ? frontmatter.title : path;
  const isPublic = !loading && frontmatter.draft !== true && isBuiltByBlog(path);
  const state = typeof frontmatter.state === 'string' ? frontmatter.state : null;

  useEffect(() => {
    let cancelled = false;
    gitStatus({ silent: true })
      .then((s) => {
        if (!cancelled) setGit(describeGit(s.files, path, deletionUnit(path, docs)));
      })
      .catch(() => {
        if (!cancelled) setGit(GIT_UNKNOWN);
      });
    return () => {
      cancelled = true;
    };
  }, [path, docs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!busy) onCancel();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [busy, onCancel]);

  const confirm = async () => {
    if (busy || loading) return;
    setBusy(true);
    setError(null);
    try {
      await pauseAutosave();
      const result = await deleteDoc(path);
      onDeleted(path, result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      resumeAutosave();
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (!busy) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="글 삭제"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)',
          width: 440,
          maxWidth: 'calc(100vw - 48px)',
          padding: '20px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Mono style={{ fontSize: 10, color: 'var(--err)', letterSpacing: '0.04em' }}>
            글 삭제
          </Mono>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{title}</h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', wordBreak: 'break-all' }}>
            {path}
          </Mono>
        </div>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          <Row tone="ink">
            {unit.kind === 'folder' ? (
              <>
                폴더 <Mono style={{ fontSize: 11 }}>{unit.path}</Mono> 전체를 지웁니다 (assets
                포함).
              </>
            ) : (
              '이 파일만 지웁니다. 같은 폴더의 다른 파일은 남습니다.'
            )}
          </Row>
          {isPublic && (
            <Row tone="warn">
              공개 글입니다{state ? ` (state: ${state})` : ''}. 다음 커밋·배포 때 블로그에서도
              내려갑니다.
            </Row>
          )}
          <Row tone={git ? git.tone : 'mute'}>{git ? git.text : 'git 상태 확인 중…'}</Row>
          <Row tone="mute">
            삭제 전에 앱 데이터의 backups/docs-&lt;시각&gt;/ 아래로 복사하고, 복사가 실패하면 지우지
            않습니다.
          </Row>
        </ul>

        {error && (
          <Mono
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--err)',
              background: 'var(--err-soft)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
          </Mono>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="button" ghost sm onClick={onCancel} disabled={busy} autoFocus>
            취소
          </Button>
          <Button
            type="button"
            danger
            sm
            onClick={() => void confirm()}
            disabled={busy || loading}
            style={{ opacity: busy || loading ? 0.6 : 1 }}
          >
            {busy ? '삭제 중…' : unit.kind === 'folder' ? '폴더째 삭제' : '삭제'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ tone, children }: { tone: Tone; children: ReactNode }) {
  const color =
    tone === 'warn'
      ? 'var(--warn)'
      : tone === 'ok'
        ? 'var(--ok)'
        : tone === 'mute'
          ? 'var(--ink-mute)'
          : 'var(--ink)';
  return (
    <li style={{ display: 'flex', gap: 8, color }}>
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: 6,
          height: 6,
          borderRadius: 3,
          marginTop: 7,
          background: 'currentColor',
        }}
      />
      <span style={{ minWidth: 0 }}>{children}</span>
    </li>
  );
}
