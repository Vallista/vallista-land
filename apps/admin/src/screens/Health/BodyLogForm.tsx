import { useState } from 'react';
import { Button, Input, Select } from '../../components/atoms/Atoms';
import type { BodyLog, BodyLogInput, ExerciseEntry, MealEntry } from '../../lib/tauri';

const EXERCISE_CATEGORIES = [
  { value: 'strength', label: '근력' },
  { value: 'cardio', label: '유산소' },
  { value: 'flexibility', label: '유연성' },
  { value: 'sports', label: '스포츠' },
  { value: 'other', label: '기타' },
];

interface Props {
  date: string;
  initial?: BodyLog | null;
  onSave: (input: BodyLogInput) => Promise<void>;
  onCancel: () => void;
}

function newExercise(): ExerciseEntry {
  return { name: '', category: 'strength' };
}

function newMeal(): MealEntry {
  return { name: '' };
}

export function BodyLogForm({ date, initial, onSave, onCancel }: Props) {
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? '');
  const [bodyFat, setBodyFat] = useState(initial?.bodyFat?.toString() ?? '');
  const [sleepAt, setSleepAt] = useState(initial?.sleepAt ?? '');
  const [wakeAt, setWakeAt] = useState(initial?.wakeAt ?? '');
  const [exercises, setExercises] = useState<ExerciseEntry[]>(initial?.exercises ?? []);
  const [meals, setMeals] = useState<MealEntry[]>(initial?.meals ?? []);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        date,
        weight: weight ? parseFloat(weight) : undefined,
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        sleepAt: sleepAt || undefined,
        wakeAt: wakeAt || undefined,
        exercises: exercises.filter((e) => e.name.trim()),
        meals: meals.filter((m) => m.name.trim()),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateExercise = (i: number, patch: Partial<ExerciseEntry>) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };

  const updateMeal = (i: number, patch: Partial<MealEntry>) => {
    setMeals((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  };

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 'var(--card-pad)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-lg)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {date} 기록
      </div>

      {/* 기본 지표 */}
      <Section label="기본 지표">
        <Row>
          <Field label="체중 (kg)">
            <Input
              type="number"
              placeholder="예: 70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ width: 120 }}
            />
          </Field>
          <Field label="체지방 (%)">
            <Input
              type="number"
              placeholder="예: 18.0"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              style={{ width: 120 }}
            />
          </Field>
        </Row>
      </Section>

      {/* 수면 */}
      <Section label="수면">
        <Row>
          <Field label="취침">
            <Input
              type="time"
              value={sleepAt}
              onChange={(e) => setSleepAt(e.target.value)}
              style={{ width: 120 }}
            />
          </Field>
          <Field label="기상">
            <Input
              type="time"
              value={wakeAt}
              onChange={(e) => setWakeAt(e.target.value)}
              style={{ width: 120 }}
            />
          </Field>
        </Row>
      </Section>

      {/* 운동 */}
      <Section label="운동">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          {exercises.map((ex, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 70px 60px 60px 60px auto',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <Input
                placeholder="운동 이름"
                value={ex.name}
                onChange={(e) => updateExercise(i, { name: e.target.value })}
              />
              <Select
                options={EXERCISE_CATEGORIES}
                value={ex.category}
                onChange={(v) => v && updateExercise(i, { category: v as ExerciseEntry['category'] })}
              />
              <Input
                type="number"
                placeholder="분"
                value={ex.duration?.toString() ?? ''}
                onChange={(e) => updateExercise(i, { duration: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="세트"
                value={ex.sets?.toString() ?? ''}
                onChange={(e) => updateExercise(i, { sets: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="회"
                value={ex.reps?.toString() ?? ''}
                onChange={(e) => updateExercise(i, { reps: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="kg"
                value={ex.weight?.toString() ?? ''}
                onChange={(e) => updateExercise(i, { weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <button
                onClick={() => setExercises((prev) => prev.filter((_, idx) => idx !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-mute)',
                  fontSize: 14,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setExercises((prev) => [...prev, newExercise()])}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: '1px dashed var(--line)',
              borderRadius: 6,
              color: 'var(--ink-mute)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 10px',
            }}
          >
            + 운동 추가
          </button>
        </div>
      </Section>

      {/* 식사 */}
      <Section label="식사">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          {meals.map((meal, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 80px 70px 70px 70px auto',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <Input
                type="time"
                value={meal.time ?? ''}
                onChange={(e) => updateMeal(i, { time: e.target.value || undefined })}
              />
              <Input
                placeholder="음식 이름"
                value={meal.name}
                onChange={(e) => updateMeal(i, { name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="kcal"
                value={meal.calories?.toString() ?? ''}
                onChange={(e) => updateMeal(i, { calories: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="단백g"
                value={meal.protein?.toString() ?? ''}
                onChange={(e) => updateMeal(i, { protein: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="탄수g"
                value={meal.carbs?.toString() ?? ''}
                onChange={(e) => updateMeal(i, { carbs: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder="지방g"
                value={meal.fat?.toString() ?? ''}
                onChange={(e) => updateMeal(i, { fat: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <button
                onClick={() => setMeals((prev) => prev.filter((_, idx) => idx !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-mute)',
                  fontSize: 14,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setMeals((prev) => [...prev, newMeal()])}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: '1px dashed var(--line)',
              borderRadius: 6,
              color: 'var(--ink-mute)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 10px',
            }}
          >
            + 식사 추가
          </button>
        </div>
      </Section>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button ghost onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{label}</div>
      {children}
    </div>
  );
}
