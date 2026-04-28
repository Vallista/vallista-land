import type { Mood } from '@vallista/content-core';

export function avgMoodStats(
  moods: Mood[],
): { energy: number | null; mood: number | null; count: number } {
  const energies = moods
    .map((m) => m.energy)
    .filter((v): v is number => typeof v === 'number');
  const moodVals = moods
    .map((m) => m.mood)
    .filter((v): v is number => typeof v === 'number');
  return {
    energy:
      energies.length > 0
        ? energies.reduce((a, b) => a + b, 0) / energies.length
        : null,
    mood:
      moodVals.length > 0
        ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length
        : null,
    count: Math.max(energies.length, moodVals.length),
  };
}

export function filterThisWeek(
  moods: Mood[],
  todayISO: string,
  weekStartDay: 'mon' | 'sun',
): Mood[] {
  const today = new Date(`${todayISO}T00:00:00`);
  const startDow = weekStartDay === 'mon' ? 1 : 0;
  const dayOfWeek = today.getDay();
  const daysFromStart = (dayOfWeek - startDow + 7) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - daysFromStart);
  const startKey = startISO(start);
  return moods.filter((m) => m.date >= startKey && m.date <= todayISO);
}

export function filterThisMonth(moods: Mood[], todayISO: string): Mood[] {
  const prefix = todayISO.slice(0, 7);
  return moods.filter((m) => m.date.startsWith(prefix));
}

function startISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dd}`;
}
