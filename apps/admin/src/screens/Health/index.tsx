import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Mono, Select } from '../../components/atoms/Atoms';
import {
  deleteBodyLog,
  getBodySpec,
  listBodyLogInRange,
  llmChat,
  setBodyLog,
  setBodySpec,
  type BodyLog,
  type BodyLogInput,
  type BodySpec,
} from '../../lib/tauri';
import { BodyLogForm } from './BodyLogForm';
import { BmiGauge, ExerciseHeatmap, SleepChart, WeightChart } from './HealthCharts';

const RANGES = [
  { value: '7', label: '7일' },
  { value: '30', label: '30일' },
  { value: '90', label: '90일' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: '비활동 (주로 앉아서)' },
  { value: 'light', label: '가벼운 활동 (주 1-3회)' },
  { value: 'moderate', label: '보통 (주 3-5회)' },
  { value: 'active', label: '활발 (주 6-7회)' },
  { value: 'very_active', label: '매우 활발 (하루 2회)' },
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeStart(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseSleepHours(sleepAt?: string, wakeAt?: string): number | null {
  if (!sleepAt || !wakeAt) return null;
  const sp = sleepAt.split(':');
  const wp = wakeAt.split(':');
  const sh = parseInt(sp[0] ?? '0', 10);
  const sm = parseInt(sp[1] ?? '0', 10);
  const wh = parseInt(wp[0] ?? '0', 10);
  const wm = parseInt(wp[1] ?? '0', 10);
  const sleepMin = sh * 60 + sm;
  const wakeMin = wh * 60 + wm;
  const diff = wakeMin < sleepMin ? 24 * 60 - sleepMin + wakeMin : wakeMin - sleepMin;
  return Math.round((diff / 60) * 10) / 10;
}

function buildLlmPrompt(spec: BodySpec, recentLogs: BodyLog[]): string {
  const heightM = spec.height / 100;
  const lastWeight = [...recentLogs].reverse().find((l) => l.weight)?.weight;
  const bmi = lastWeight ? (lastWeight / (heightM * heightM)).toFixed(1) : null;
  const avgSleep =
    recentLogs
      .map((l) => parseSleepHours(l.sleepAt, l.wakeAt))
      .filter((h): h is number => h != null)
      .reduce((a, b, _, arr) => a + b / arr.length, 0)
      .toFixed(1);
  const exerciseDays = recentLogs.filter((l) => (l.exercises?.length ?? 0) > 0).length;
  const exerciseNames = [
    ...new Set(recentLogs.flatMap((l) => l.exercises?.map((e) => e.name) ?? [])),
  ].join(', ');

  const parts = [
    `신체 스펙: 신장 ${spec.height}cm, ${spec.gender === 'male' ? '남성' : spec.gender === 'female' ? '여성' : '성별 미입력'}`,
    spec.birthYear ? `출생연도 ${spec.birthYear}` : null,
    lastWeight ? `현재 체중 ${lastWeight}kg, BMI ${bmi}` : null,
    spec.targetWeight ? `목표 체중 ${spec.targetWeight}kg` : null,
    `최근 ${recentLogs.length}일 평균 수면 ${avgSleep}시간`,
    `최근 ${recentLogs.length}일 중 운동한 날 ${exerciseDays}일`,
    exerciseNames ? `주요 운동: ${exerciseNames}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `다음은 나의 신체 스펙과 최근 활동 요약입니다:\n\n${parts}\n\n위 데이터를 바탕으로 아래 3가지를 간결하게 알려주세요:\n1. 현재 상태 평가 (BMI, 수면, 운동 빈도)\n2. 보완이 필요한 운동/식단\n3. 이번 주 구체적 실천 제안 1-2가지`;
}

export function Health() {
  const [range, setRange] = useState<string>('30');
  const [logs, setLogs] = useState<BodyLog[]>([]);
  const [spec, setSpec] = useState<BodySpec | null>(null);
  const [specEdit, setSpecEdit] = useState(false);
  const [specDraft, setSpecDraft] = useState<Partial<BodySpec>>({});
  const [formDate, setFormDate] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [llmAdvice, setLlmAdvice] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const llmFetchedRef = useRef(false);

  const reload = useCallback(async () => {
    const days = parseInt(range);
    const start = rangeStart(days);
    const end = todayStr();
    const data = await listBodyLogInRange(start, end).catch(() => [] as BodyLog[]);
    setLogs(data);
  }, [range]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    getBodySpec()
      .then(setSpec)
      .catch(() => setSpec(null));
  }, []);

  const fetchAdvice = useCallback(async (currentSpec: BodySpec, currentLogs: BodyLog[]) => {
    if (llmFetchedRef.current) return;
    llmFetchedRef.current = true;
    setLlmLoading(true);
    try {
      const prompt = buildLlmPrompt(currentSpec, currentLogs.slice(-14));
      const result = await llmChat({ messages: [{ role: 'user', content: prompt }], maxTokens: 400 });
      setLlmAdvice(result);
    } catch {
      setLlmAdvice(null);
    } finally {
      setLlmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (spec && logs.length > 0 && !llmAdvice && !llmLoading) {
      llmFetchedRef.current = false;
      fetchAdvice(spec, logs);
    }
  }, [spec, logs, llmAdvice, llmLoading, fetchAdvice]);

  const handleSaveLog = async (input: BodyLogInput) => {
    await setBodyLog(input);
    setFormDate(null);
    await reload();
    llmFetchedRef.current = false;
    setLlmAdvice(null);
  };

  const handleDeleteLog = async (date: string) => {
    await deleteBodyLog(date);
    setExpandedDate(null);
    await reload();
  };

  const handleSaveSpec = async () => {
    if (!specDraft.height) return;
    const saved = await setBodySpec(specDraft as BodySpec);
    setSpec(saved);
    setSpecEdit(false);
    llmFetchedRef.current = false;
    setLlmAdvice(null);
  };

  const lastWeight = [...logs].reverse().find((l) => l.weight)?.weight;

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 var(--gap-lg)',
          height: 'var(--topbar-h)',
          flex: '0 0 var(--topbar-h)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>헬스</span>
        <Select options={RANGES} value={range} onChange={(v) => v && setRange(v)} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button ghost sm onClick={() => { setSpecEdit((v) => !v); setSpecDraft(spec ?? {}); }}>
            신체 스펙
          </Button>
          <Button
            sm
            onClick={() => setFormDate((d) => (d === todayStr() ? null : todayStr()))}
          >
            + 오늘 기록
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-lg)' }}>

        {/* 스펙 편집 패널 */}
        {specEdit && (
          <SpecEditPanel
            draft={specDraft}
            onChange={setSpecDraft}
            onSave={handleSaveSpec}
            onCancel={() => setSpecEdit(false)}
          />
        )}

        {/* 오늘 기록 폼 */}
        {formDate && (
          <div style={{ marginBottom: 'var(--gap-lg)' }}>
            <BodyLogForm
              date={formDate}
              initial={logs.find((l) => l.date === formDate)}
              onSave={handleSaveLog}
              onCancel={() => setFormDate(null)}
            />
          </div>
        )}

        {/* 메인 컨텐츠: 좌 패널 + 우 차트 */}
        <div style={{ display: 'flex', gap: 'var(--gap-lg)', marginBottom: 'var(--gap-lg)', alignItems: 'flex-start' }}>
          {/* 좌: 신체 스펙 + BMI + LLM 추천 */}
          <div
            style={{
              flex: '0 0 260px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--gap)',
            }}
          >
            {spec ? (
              <SpecCard spec={spec} lastWeight={lastWeight} onEdit={() => { setSpecEdit(true); setSpecDraft(spec); }} />
            ) : (
              <div
                style={{
                  padding: 'var(--card-pad)',
                  border: '1px dashed var(--line)',
                  borderRadius: 10,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'var(--ink-mute)',
                  fontSize: 12,
                }}
                onClick={() => setSpecEdit(true)}
              >
                신체 스펙 입력하기
              </div>
            )}

            {spec && (
              <div
                style={{
                  padding: 'var(--card-pad)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  background: 'var(--bg)',
                }}
              >
                <BmiGauge spec={spec} currentWeight={lastWeight} />
              </div>
            )}

            <div
              style={{
                padding: 'var(--card-pad)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                background: 'var(--bg)',
                minHeight: 80,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 8, fontWeight: 500 }}>
                AI 추천
              </div>
              {llmLoading ? (
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>분석 중…</div>
              ) : llmAdvice ? (
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {llmAdvice}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
                  {spec ? '기록이 쌓이면 AI가 분석해줍니다.' : '신체 스펙을 먼저 입력하세요.'}
                  {spec && logs.length > 0 && (
                    <button
                      onClick={() => { llmFetchedRef.current = false; fetchAdvice(spec, logs); }}
                      style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      다시 분석하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 우: 차트 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
            <div
              style={{
                padding: 'var(--card-pad)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                background: 'var(--bg)',
              }}
            >
              <WeightChart logs={logs} targetWeight={spec?.targetWeight} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
              <div
                style={{
                  padding: 'var(--card-pad)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  background: 'var(--bg)',
                }}
              >
                <SleepChart logs={logs} />
              </div>
              <div
                style={{
                  padding: 'var(--card-pad)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  background: 'var(--bg)',
                }}
              >
                <ExerciseHeatmap logs={logs} days={parseInt(range)} />
              </div>
            </div>
          </div>
        </div>

        {/* 일별 로그 리스트 */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px var(--card-pad)',
              borderBottom: sortedLogs.length > 0 ? '1px solid var(--line)' : 'none',
              fontSize: 11,
              color: 'var(--ink-mute)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--bg-soft)',
            }}
          >
            일별 기록
          </div>
          {sortedLogs.length === 0 ? (
            <div style={{ padding: 'var(--card-pad)', fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center' }}>
              기록이 없습니다. 오늘 기록을 시작해보세요.
            </div>
          ) : (
            sortedLogs.map((log, i) => (
              <LogRow
                key={log.date}
                log={log}
                expanded={expandedDate === log.date}
                isLast={i === sortedLogs.length - 1}
                onToggle={() => setExpandedDate((d) => (d === log.date ? null : log.date))}
                onEdit={() => setFormDate(log.date)}
                onDelete={() => handleDeleteLog(log.date)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SpecCard({ spec, lastWeight, onEdit }: { spec: BodySpec; lastWeight?: number; onEdit: () => void }) {
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.value === spec.activityLevel)?.label ?? '—';
  return (
    <div
      style={{
        padding: 'var(--card-pad)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>신체 스펙</Mono>
        <button onClick={onEdit} style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
          편집
        </button>
      </div>
      <SpecRow label="신장" value={`${spec.height} cm`} />
      {lastWeight && <SpecRow label="현재 체중" value={`${lastWeight} kg`} />}
      {spec.targetWeight && <SpecRow label="목표 체중" value={`${spec.targetWeight} kg`} />}
      {spec.birthYear && <SpecRow label="출생연도" value={`${spec.birthYear}`} />}
      {spec.gender && <SpecRow label="성별" value={spec.gender === 'male' ? '남성' : '여성'} />}
      <SpecRow label="활동 수준" value={activityLabel} />
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{label}</span>
      <Mono style={{ fontSize: 11, color: 'var(--ink-2)' }}>{value}</Mono>
    </div>
  );
}

function SpecEditPanel({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Partial<BodySpec>;
  onChange: (p: Partial<BodySpec>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: 'var(--gap-lg)',
        padding: 'var(--card-pad)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        신체 스펙 설정
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <FormField label="신장 (cm) *">
          <Input
            type="number"
            placeholder="예: 175"
            value={draft.height?.toString() ?? ''}
            onChange={(e) => onChange({ ...draft, height: e.target.value ? parseFloat(e.target.value) : undefined })}
            style={{ width: 100 }}
          />
        </FormField>
        <FormField label="목표 체중 (kg)">
          <Input
            type="number"
            placeholder="예: 70"
            value={draft.targetWeight?.toString() ?? ''}
            onChange={(e) => onChange({ ...draft, targetWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
            style={{ width: 100 }}
          />
        </FormField>
        <FormField label="출생연도">
          <Input
            type="number"
            placeholder="예: 1990"
            value={draft.birthYear?.toString() ?? ''}
            onChange={(e) => onChange({ ...draft, birthYear: e.target.value ? parseInt(e.target.value) : undefined })}
            style={{ width: 100 }}
          />
        </FormField>
        <FormField label="성별">
          <Select
            options={[{ value: 'male', label: '남성' }, { value: 'female', label: '여성' }]}
            value={draft.gender ?? ''}
            onChange={(v) => onChange({ ...draft, gender: v as 'male' | 'female' })}
          />
        </FormField>
        <FormField label="활동 수준">
          <Select
            options={ACTIVITY_LEVELS}
            value={draft.activityLevel ?? ''}
            onChange={(v) => onChange({ ...draft, activityLevel: v as BodySpec['activityLevel'] })}
          />
        </FormField>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button ghost onClick={onCancel}>취소</Button>
        <Button onClick={onSave} disabled={!draft.height}>저장</Button>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{label}</div>
      {children}
    </div>
  );
}

function LogRow({
  log,
  expanded,
  isLast,
  onToggle,
  onEdit,
  onDelete,
}: {
  log: BodyLog;
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sleepHours = parseSleepHours(log.sleepAt, log.wakeAt);
  const exerciseCount = log.exercises?.length ?? 0;
  const mealCount = log.meals?.length ?? 0;

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
      <div
        onClick={onToggle}
        style={{
          padding: '10px var(--card-pad)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          background: expanded ? 'var(--bg-shade)' : 'var(--bg)',
          transition: 'background 120ms',
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = 'var(--bg-soft)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'var(--bg)'; }}
      >
        <Mono style={{ fontSize: 11, color: 'var(--ink-2)', flex: '0 0 90px' }}>{log.date}</Mono>
        <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
          {log.weight && <Chip>{log.weight} kg</Chip>}
          {sleepHours && <Chip>수면 {sleepHours}h</Chip>}
          {exerciseCount > 0 && <Chip>운동 {exerciseCount}개</Chip>}
          {mealCount > 0 && <Chip>식사 {mealCount}끼</Chip>}
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', flex: '0 0 14px' }}>
          {expanded ? '▴' : '▾'}
        </span>
      </div>

      {expanded && (
        <div
          style={{
            padding: 'var(--gap) var(--card-pad) var(--card-pad)',
            background: 'var(--bg-shade)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap)',
          }}
        >
          {log.exercises && log.exercises.length > 0 && (
            <Section label="운동">
              {log.exercises.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--ink)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{e.name}</span>
                  <span style={{ color: 'var(--ink-mute)' }}>
                    {[
                      e.duration ? `${e.duration}분` : null,
                      e.sets && e.reps ? `${e.sets}×${e.reps}회` : null,
                      e.weight ? `${e.weight}kg` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {log.meals && log.meals.length > 0 && (
            <Section label="식사">
              {log.meals.map((m, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--ink)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {m.time && <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{m.time}</Mono>}
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <span style={{ color: 'var(--ink-mute)' }}>
                    {[
                      m.calories ? `${m.calories}kcal` : null,
                      m.protein ? `단백 ${m.protein}g` : null,
                      m.carbs ? `탄수 ${m.carbs}g` : null,
                      m.fat ? `지방 ${m.fat}g` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </Section>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button sm ghost onClick={onEdit}>편집</Button>
            <Button
              sm
              danger
              ghost
              onClick={() => { if (confirm(`${log.date} 기록을 삭제할까요?`)) onDelete(); }}
            >
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: 'var(--ink-2)',
        background: 'var(--bg-soft)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '1px 6px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}
