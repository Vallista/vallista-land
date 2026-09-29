import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { BodyLog, BodySpec } from '../../lib/tauri';

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

function fmtDate(date: string): string {
  const parts = date.split('-');
  return `${parseInt(parts[1] ?? '1')}/${parseInt(parts[2] ?? '1')}`;
}

const tooltipStyle = {
  background: 'var(--bg-soft)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  fontSize: 11,
  color: 'var(--ink)',
};

interface WeightChartProps {
  logs: BodyLog[];
  targetWeight?: number;
}

export function WeightChart({ logs, targetWeight }: WeightChartProps) {
  const data = logs
    .filter((l) => l.weight != null)
    .map((l) => ({ date: fmtDate(l.date), weight: l.weight }));

  if (data.length === 0) {
    return <Empty>체중 기록 없음</Empty>;
  }

  const weights = data.map((d) => d.weight as number);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;

  return (
    <div>
      <ChartLabel>체중 추이 (kg)</ChartLabel>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--ink-mute)' }} />
          <YAxis domain={[minW, maxW]} tick={{ fontSize: 10, fill: 'var(--ink-mute)' }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v ?? ''} kg`, '체중']}
          />
          {targetWeight != null && (
            <ReferenceLine
              y={targetWeight}
              stroke="var(--blue)"
              strokeDasharray="4 4"
              label={{ value: `목표 ${targetWeight}kg`, fontSize: 9, fill: 'var(--blue)', position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--ink-2)"
            strokeWidth={1.5}
            dot={{ r: 3, fill: 'var(--ink-2)', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SleepChartProps {
  logs: BodyLog[];
}

export function SleepChart({ logs }: SleepChartProps) {
  const data = logs
    .map((l) => {
      const hours = parseSleepHours(l.sleepAt, l.wakeAt);
      return hours != null ? { date: fmtDate(l.date), hours } : null;
    })
    .filter(Boolean) as { date: string; hours: number }[];

  if (data.length === 0) {
    return <Empty>수면 기록 없음</Empty>;
  }

  return (
    <div>
      <ChartLabel>수면 시간 (시간)</ChartLabel>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--ink-mute)' }} />
          <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: 'var(--ink-mute)' }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v ?? ''}시간`, '수면']}
          />
          <ReferenceLine y={8} stroke="var(--blue)" strokeDasharray="4 4" />
          <Bar dataKey="hours" fill="var(--ink-mute)" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ExerciseHeatmapProps {
  logs: BodyLog[];
  days?: number;
}

export function ExerciseHeatmap({ logs, days = 90 }: ExerciseHeatmapProps) {
  const today = new Date();
  const cells: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = logs.find((l) => l.date === dateStr);
    cells.push({ date: dateStr, count: log?.exercises?.length ?? 0 });
  }

  function cellColor(count: number): string {
    if (count === 0) return 'var(--bg-shade)';
    if (count === 1) return 'rgba(100,160,255,0.35)';
    if (count === 2) return 'rgba(100,160,255,0.6)';
    return 'rgba(100,160,255,0.85)';
  }

  return (
    <div>
      <ChartLabel>운동 히트맵 (최근 {days}일)</ChartLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(18, 1fr)',
          gap: 3,
          marginTop: 6,
        }}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date}${c.count > 0 ? ` · ${c.count}개 운동` : ''}`}
            style={{
              aspectRatio: '1',
              borderRadius: 3,
              background: cellColor(c.count),
              cursor: 'default',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(n) }} />
            <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {n === 0 ? '없음' : `${n}${n === 3 ? '+' : ''}개`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BmiGaugeProps {
  spec: BodySpec;
  currentWeight?: number;
}

export function BmiGauge({ spec, currentWeight }: BmiGaugeProps) {
  const weight = currentWeight;
  const heightM = spec.height / 100;
  const bmi = weight ? weight / (heightM * heightM) : null;

  function bmiLabel(b: number): { label: string; color: string } {
    if (b < 18.5) return { label: '저체중', color: 'var(--blue)' };
    if (b < 23) return { label: '정상', color: '#4caf50' };
    if (b < 25) return { label: '과체중', color: 'var(--warn)' };
    return { label: '비만', color: '#e53935' };
  }

  const bmiInfo = bmi != null ? bmiLabel(bmi) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>BMI</span>
        {bmi != null && bmiInfo ? (
          <span style={{ fontSize: 20, fontWeight: 700, color: bmiInfo.color, fontFamily: 'var(--font-mono)' }}>
            {bmi.toFixed(1)}
            <span style={{ fontSize: 11, fontWeight: 400, color: bmiInfo.color, marginLeft: 6 }}>
              {bmiInfo.label}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>체중 기록 필요</span>
        )}
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'linear-gradient(to right, var(--blue) 0%, #4caf50 30%, #4caf50 55%, var(--warn) 65%, #e53935 100%)',
          position: 'relative',
        }}
      >
        {bmi != null && (
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100)}%`,
              transform: 'translateX(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--bg)',
              border: `2px solid ${bmiInfo!.color}`,
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
        <span>15</span>
        <span>18.5</span>
        <span>23</span>
        <span>25</span>
        <span>40</span>
      </div>
    </div>
  );
}

function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', fontSize: 12 }}>
      {children}
    </div>
  );
}
