import { useEffect, useRef, useState } from 'react';
import type { Mood } from '@vallista/content-core';
import {
  Button,
  Input,
  Mono,
  Textarea,
} from '../../components/atoms/Atoms';

type Mode = 'morning' | 'afternoon' | 'evening' | 'late';

interface Props {
  today: Mood | null | undefined;
  now: Date;
  onMoodSubmit: (energy: number, mood: number, note?: string) => Promise<void>;
  onRetrospectiveSubmit: (note: string) => Promise<void>;
}

export function RitualSlot({ today, now, onMoodSubmit, onRetrospectiveSubmit }: Props) {
  const mode = getMode(now);
  const isEveningMode = mode === 'evening' || mode === 'late';
  const loading = today === undefined;
  const moodRecorded = !!today && today.energy !== undefined && today.mood !== undefined;
  const retroRecorded = !!today?.retrospectiveNote;
  const moodLate = !moodRecorded && mode !== 'morning';

  const [moodOverride, setMoodOverride] = useState<boolean | null>(null);
  const [retroOverride, setRetroOverride] = useState<boolean | null>(null);

  const moodOpen = moodOverride ?? !moodRecorded;
  const retroOpen = retroOverride ?? !retroRecorded;

  const handleMoodSubmit = async (energy: number, mood: number, note?: string) => {
    await onMoodSubmit(energy, mood, note);
    setMoodOverride(false);
  };

  const handleRetroSubmit = async (note: string) => {
    await onRetrospectiveSubmit(note);
    setRetroOverride(false);
  };

  return (
    <div>
      {loading ? (
        <div style={{ color: 'var(--ink-mute)', fontSize: 12 }}>읽는 중…</div>
      ) : (
        <>
          <SectionHead
            label="오전 컨디션"
            sub={!isEveningMode ? subFor(mode) : undefined}
          />
          <MoodSection
            open={moodOpen}
            recorded={moodRecorded}
            late={moodLate}
            mood={today}
            compact={isEveningMode}
            onSubmit={handleMoodSubmit}
            onToggle={() => setMoodOverride(moodOpen ? false : true)}
          />

          {isEveningMode && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{ height: 1, background: 'var(--line)', margin: '0 0 14px' }}
              />
              <SectionHead label="저녁 회고" sub={subFor(mode)} />
              <RetroSection
                open={retroOpen}
                recorded={retroRecorded}
                mood={today}
                onSubmit={handleRetroSubmit}
                onToggle={() => setRetroOverride(retroOpen ? false : true)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MoodSection({
  open,
  recorded,
  late,
  mood,
  compact,
  onSubmit,
  onToggle,
}: {
  open: boolean;
  recorded: boolean;
  late: boolean;
  mood: Mood | null | undefined;
  compact: boolean;
  onSubmit: (energy: number, m: number, note?: string) => Promise<void>;
  onToggle: () => void;
}) {
  if (!open) {
    return (
      <ChipRow
        onClick={onToggle}
        leading={
          <Mono
            style={{
              fontSize: 10.5,
              color: recorded ? 'var(--ok)' : 'var(--warn)',
              minWidth: 60,
            }}
          >
            {compact ? '컨디션' : '오전 컨디션'}
          </Mono>
        }
        body={
          recorded && mood ? (
            <>
              <Mono style={{ fontSize: 12, color: 'var(--ink)' }}>
                에너지 {Math.round((mood.energy ?? 0) * 100)} · 기분 {Math.round((mood.mood ?? 0) * 100)}
              </Mono>
              {mood.note && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                    marginLeft: 10,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  · {mood.note}
                </span>
              )}
            </>
          ) : (
            <Mono style={{ fontSize: 12, color: 'var(--warn)' }}>
              {late ? '아직 안 적음 · 지금이라도' : '체크인 안 함'}
            </Mono>
          )
        }
        trailing={
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {recorded ? '수정' : '열기'} ›
          </Mono>
        }
      />
    );
  }

  return (
    <MoodEditor
      mood={mood}
      late={late}
      compact={compact}
      onSubmit={onSubmit}
      onCollapse={recorded ? onToggle : undefined}
    />
  );
}

function MoodEditor({
  mood,
  late,
  compact,
  onSubmit,
  onCollapse,
}: {
  mood: Mood | null | undefined;
  late: boolean;
  compact: boolean;
  onSubmit: (energy: number, m: number, note?: string) => Promise<void>;
  onCollapse?: () => void;
}) {
  const [energy, setEnergy] = useState<number>(mood?.energy ?? 0.6);
  const [moodVal, setMoodVal] = useState<number>(mood?.mood ?? 0.6);
  const [note, setNote] = useState<string>(mood?.note ?? '');
  const [busy, setBusy] = useState(false);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    if (mood) {
      if (mood.energy !== undefined) setEnergy(mood.energy);
      if (mood.mood !== undefined) setMoodVal(mood.mood);
      setNote(mood.note ?? '');
      synced.current = true;
    }
  }, [mood]);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(energy, moodVal, note.trim() || undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {late && !compact && (
        <Mono
          style={{
            fontSize: 11,
            color: 'var(--warn)',
            background: 'var(--warn-soft)',
            padding: '6px 10px',
            borderRadius: 6,
            display: 'inline-block',
            alignSelf: 'flex-start',
          }}
        >
          오늘 컨디션을 아직 안 적었어요 · 지금이라도 OK
        </Mono>
      )}
      <SliderRow label="에너지" value={energy} onChange={setEnergy} color="var(--ok)" />
      <SliderRow label="기분" value={moodVal} onChange={setMoodVal} color="var(--blue)" />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="짧은 메모 (선택)"
          style={{ flex: 1, padding: '6px 10px', fontSize: 12.5 }}
        />
        <Button sm onClick={submit} disabled={busy}>
          {busy ? '저장 중…' : mood?.energy !== undefined ? '갱신' : '체크인'}
        </Button>
        {onCollapse && (
          <Button sm ghost onClick={onCollapse} disabled={busy}>
            접기
          </Button>
        )}
      </div>
    </div>
  );
}

function RetroSection({
  open,
  recorded,
  mood,
  onSubmit,
  onToggle,
}: {
  open: boolean;
  recorded: boolean;
  mood: Mood | null | undefined;
  onSubmit: (note: string) => Promise<void>;
  onToggle: () => void;
}) {
  if (!open) {
    return (
      <ChipRow
        onClick={onToggle}
        leading={
          <Mono
            style={{
              fontSize: 10.5,
              color: recorded ? 'var(--blue)' : 'var(--warn)',
              minWidth: 60,
            }}
          >
            저녁 회고
          </Mono>
        }
        body={
          recorded && mood?.retrospectiveNote ? (
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              {mood.retrospectiveNote}
            </span>
          ) : (
            <Mono style={{ fontSize: 12, color: 'var(--warn)' }}>
              하루를 돌아볼 시간
            </Mono>
          )
        }
        trailing={
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {recorded ? formatRel(mood?.retrospectiveAt) + ' · 수정' : '열기'} ›
          </Mono>
        }
      />
    );
  }

  return (
    <RetroEditor
      mood={mood}
      onSubmit={onSubmit}
      onCollapse={recorded ? onToggle : undefined}
    />
  );
}

function RetroEditor({
  mood,
  onSubmit,
  onCollapse,
}: {
  mood: Mood | null | undefined;
  onSubmit: (note: string) => Promise<void>;
  onCollapse?: () => void;
}) {
  const [note, setNote] = useState<string>(mood?.retrospectiveNote ?? '');
  const [busy, setBusy] = useState(false);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    if (mood) {
      setNote(mood.retrospectiveNote ?? '');
      synced.current = true;
    }
  }, [mood]);

  const dirty = note.trim() !== (mood?.retrospectiveNote ?? '');

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(note);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="오늘 어땠어요? 짧게라도 적어두면 좋아요"
        rows={4}
        style={{
          width: '100%',
          fontSize: 13.5,
          lineHeight: 1.65,
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', flex: 1 }}>
          {note.length > 0 ? `${note.length}자` : ' '}
        </Mono>
        <Button sm onClick={submit} disabled={busy || !dirty}>
          {busy ? '저장 중…' : mood?.retrospectiveNote ? '갱신' : '기록'}
        </Button>
        {onCollapse && (
          <Button sm ghost onClick={onCollapse} disabled={busy}>
            접기
          </Button>
        )}
      </div>
    </div>
  );
}

function ChipRow({
  onClick,
  leading,
  body,
  trailing,
}: {
  onClick: () => void;
  leading: React.ReactNode;
  body: React.ReactNode;
  trailing: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-shade)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        {body}
      </div>
      {trailing}
    </button>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--ink-soft)', minWidth: 44 }}>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ flex: 1, accentColor: color }}
      />
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', minWidth: 28 }}>
        {Math.round(value * 100)}
      </Mono>
    </div>
  );
}

function getMode(now: Date): Mode {
  const h = now.getHours();
  if (h < 5) return 'late';
  if (h < 14) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}


function subFor(mode: Mode): string {
  if (mode === 'morning') return '5–14시';
  if (mode === 'afternoon') return '14–18시';
  if (mode === 'evening') return '18시 이후';
  return '자정 이후';
}

function SectionHead({ label, sub }: { label: string; sub?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
        {label}
      </Mono>
      {sub && (
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{sub}</Mono>
      )}
    </div>
  );
}

function formatRel(iso: string | undefined): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}
