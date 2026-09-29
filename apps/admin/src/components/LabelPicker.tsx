import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Input } from './atoms/Atoms';
import { useLabels, addLabel, resolveLabel } from '../screens/Plan/labelCatalog';
import type { Label } from '../screens/Plan/labelCatalog';

const QUICK_COLORS = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#4ade80',
  '#34d399',
  '#60a5fa',
  '#c4b5fd',
  '#f472b6',
];

interface LabelPickerProps {
  kind?: string | null;
  color?: string | null;
  onChange: (kind: string, color: string) => void;
}

export function LabelPicker({ kind, color: colorProp, onChange }: LabelPickerProps) {
  const { labels } = useLabels();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(QUICK_COLORS[0] ?? '#f87171');
  const [hexInput, setHexInput] = useState('');

  function handleAddLabel() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const finalColor =
      hexInput.trim().startsWith('#') && hexInput.trim().length >= 4 ? hexInput.trim() : newColor;
    const created = addLabel({ name: trimmed, color: finalColor });
    onChange(created.id, created.color);
    setAdding(false);
    setNewName('');
    setNewColor(QUICK_COLORS[0] ?? '#f87171');
    setHexInput('');
  }

  function handleCancel() {
    setAdding(false);
    setNewName('');
    setNewColor(QUICK_COLORS[0] ?? '#f87171');
    setHexInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--gap)',
        }}
      >
        {labels.map((label: Label) => {
          const resolved = resolveLabel(kind, colorProp);
          const isActive = resolved.id === label.id && kind === label.id;
          return (
            <LabelChip
              key={label.id}
              name={label.name}
              color={label.color}
              active={isActive}
              onClick={() => onChange(label.id, label.color)}
            />
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px dashed var(--line-strong)',
              background: 'transparent',
              color: 'var(--ink-mute)',
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.2,
            }}
          >
            ＋ 새 라벨
          </button>
        )}
      </div>

      {adding && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap)',
            padding: 'var(--gap-lg)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elev)',
          }}
        >
          <Input
            sm
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="라벨 이름"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLabel();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}>
            {QUICK_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                selected={newColor === c && !hexInput.startsWith('#')}
                onClick={() => {
                  setNewColor(c);
                  setHexInput('');
                }}
              />
            ))}
          </div>

          <Input
            sm
            mono
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#hex"
            style={{ width: 90 }}
          />

          <div style={{ display: 'flex', gap: 'var(--gap)', justifyContent: 'flex-end' }}>
            <Button
              ghost
              sm
              type="button"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              sm
              type="button"
              disabled={!newName.trim()}
              onClick={handleAddLabel}
              style={!newName.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              추가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelChip({
  name,
  color,
  active,
  onClick,
}: {
  name: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const activeBg: CSSProperties['background'] = active ? `${color}22` : 'transparent';
  const activeBorder: CSSProperties['borderColor'] = active ? color : 'transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${activeBorder}`,
        background: activeBg,
        color: active ? color : 'var(--ink-soft)',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.2,
        transition: 'background 100ms, border-color 100ms, color 100ms',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color,
          flexShrink: 0,
        }}
      />
      {name}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      style={{
        width: 14,
        height: 14,
        borderRadius: 999,
        background: color,
        border: selected ? `2px solid var(--ink)` : '2px solid transparent',
        padding: 0,
        cursor: 'pointer',
        boxSizing: 'border-box',
        outline: selected ? `2px solid ${color}` : 'none',
        outlineOffset: 1,
        flexShrink: 0,
      }}
    />
  );
}
