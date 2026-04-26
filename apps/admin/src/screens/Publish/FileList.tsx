import type { GitFile } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  files: GitFile[];
  totalCount: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  onToggleAll: () => void;
  contentsOnly: boolean;
  onContentsOnlyChange: (v: boolean) => void;
};

export function FileList({
  files,
  totalCount,
  selected,
  onToggle,
  onToggleAll,
  contentsOnly,
  onContentsOnlyChange,
}: Props) {
  const allSelected = files.length > 0 && selected.size === files.length;
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
            변경된 파일
          </h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {files.length}
            {contentsOnly && totalCount > files.length ? ` / ${totalCount}` : ''}
          </Mono>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label
            style={{
              fontSize: 11,
              color: 'var(--ink-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={contentsOnly}
              onChange={(e) => onContentsOnlyChange(e.target.checked)}
            />
            contents/만
          </label>
          {files.length > 0 && (
            <button
              onClick={onToggleAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-mute)',
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>
      </header>

      {files.length === 0 ? (
        <div
          style={{
            padding: '28px 0',
            color: 'var(--ink-mute)',
            fontSize: 13,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {totalCount === 0 ? '변경 사항이 없습니다 ✓' : '필터에 맞는 변경이 없습니다'}
        </div>
      ) : (
        <div>
          {files.map((f) => (
            <Row
              key={f.path}
              file={f}
              checked={selected.has(f.path)}
              onToggle={() => onToggle(f.path)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Row({
  file,
  checked,
  onToggle,
}: {
  file: GitFile;
  checked: boolean;
  onToggle: () => void;
}) {
  const tone = file.untracked
    ? 'var(--ok)'
    : file.staged
      ? 'var(--blue)'
      : file.unstaged
        ? 'var(--warn)'
        : 'var(--ink-mute)';
  const label = file.untracked
    ? '신규'
    : file.staged && file.unstaged
      ? `${file.status}*`
      : file.status;
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 4px',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
      }}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <Mono
        style={{
          fontSize: 10,
          width: 28,
          textAlign: 'center',
          color: tone,
          background: 'var(--bg-shade)',
          padding: '2px 0',
          borderRadius: 4,
          flex: '0 0 28px',
        }}
      >
        {label}
      </Mono>
      <Mono
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {file.path}
      </Mono>
    </label>
  );
}
