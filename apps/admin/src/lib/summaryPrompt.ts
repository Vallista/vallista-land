import type { Block, DocSummary, Mood, SummaryKind } from '@vallista/content-core';

export interface SummaryPromptInput {
  kind: SummaryKind;
  rangeLabel: string;
  blocks: Block[];
  moods: Mood[];
  publishedDocs: DocSummary[];
  totalHours: number;
  deepHours: number;
  topKindHours: { kind: string; hours: number }[];
  topPeople?: { name: string; count: number }[];
  topTags?: { tag: string; n: number }[];
  weeklySummaries?: { period: string; text: string }[];
}

export interface SummaryPrompt {
  system: string;
  user: string;
}

export function buildSummaryPrompt(input: SummaryPromptInput): SummaryPrompt {
  const isMonthly = input.kind === 'monthly';
  const lines: string[] = [];
  lines.push(`기간: ${input.rangeLabel}`);
  lines.push(`총 기록 시간: ${input.totalHours.toFixed(1)}h`);
  lines.push(
    `딥워크: ${input.deepHours.toFixed(1)}h (${
      input.totalHours > 0
        ? ((input.deepHours / input.totalHours) * 100).toFixed(1)
        : '0'
    }%)`,
  );
  lines.push(`발행: ${input.publishedDocs.length}편`);
  if (input.publishedDocs.length > 0) {
    const titles = input.publishedDocs
      .slice(0, 5)
      .map((d) => `「${d.title}」`)
      .join(', ');
    lines.push(`발행한 글: ${titles}`);
  }
  if (input.topKindHours.length > 0) {
    const top = input.topKindHours
      .slice(0, 5)
      .map((k) => `${k.kind} ${k.hours.toFixed(1)}h`)
      .join(', ');
    lines.push(`종류별 시간: ${top}`);
  }

  const energies = input.moods
    .map((m) => m.energy)
    .filter((v): v is number => typeof v === 'number');
  const moodVals = input.moods
    .map((m) => m.mood)
    .filter((v): v is number => typeof v === 'number');
  if (energies.length > 0 && moodVals.length > 0) {
    const avgE = energies.reduce((a, b) => a + b, 0) / energies.length;
    const avgM = moodVals.reduce((a, b) => a + b, 0) / moodVals.length;
    lines.push(
      `평균 에너지 ${(avgE * 100).toFixed(0)}% / 평균 기분 ${(avgM * 100).toFixed(0)}%`,
    );
  }

  const conditionNotes = input.moods
    .filter((m) => m.note && m.note.trim().length > 0)
    .slice(-7)
    .map((m) => `${m.date.slice(5)}(아침): ${m.note}`);
  if (conditionNotes.length > 0) {
    lines.push(`아침 컨디션 메모: ${conditionNotes.join(' / ')}`);
  }

  const retros = input.moods
    .filter((m) => m.retrospectiveNote && m.retrospectiveNote.trim().length > 0)
    .map((m) => `${m.date.slice(5)}(저녁): ${m.retrospectiveNote!.trim()}`);
  if (retros.length > 0) {
    lines.push('');
    lines.push('저녁 회고:');
    retros.forEach((r) => lines.push(`  ${r}`));
  }

  if (input.topPeople && input.topPeople.length > 0) {
    lines.push(
      `자주 만난 사람: ${input.topPeople
        .slice(0, 5)
        .map((p) => `${p.name}(${p.count}회)`)
        .join(', ')}`,
    );
  }
  if (input.topTags && input.topTags.length > 0) {
    lines.push(
      `자주 다룬 주제: ${input.topTags
        .slice(0, 5)
        .map((t) => `${t.tag}(${t.n})`)
        .join(', ')}`,
    );
  }

  if (isMonthly && input.weeklySummaries && input.weeklySummaries.length > 0) {
    lines.push('');
    lines.push('주차별 요약:');
    for (const w of input.weeklySummaries) {
      lines.push(`[${w.period}]`);
      lines.push(w.text);
      lines.push('');
    }
  }

  const system = isMonthly
    ? '당신은 사용자의 한 달을 따뜻하게 돌아보는 코치입니다. 한국어로 답하세요.'
    : '당신은 사용자의 한 주를 따뜻하고 간결하게 돌아보는 코치입니다. 한국어로 답하세요.';

  const taskLines = isMonthly
    ? [
        '아래 데이터로 이번 달의 흐름을 따뜻하게 돌아봐줘.',
        '- 한 달의 큰 흐름 1~2 문단',
        '- 컨디션·에너지 패턴',
        '- 두드러진 작업이나 사람',
        '- 다음 달 제안 2~3가지',
        '- 마지막 줄에 한 줄 격려',
        '평문 4~6 문단, 마크다운 헤딩은 쓰지 말 것.',
      ]
    : [
        '아래 데이터로 이번 주를 따뜻하고 짧게 돌아봐줘.',
        '- 잘 풀린 부분 1~2가지 (구체적으로)',
        '- 컨디션 패턴 한 줄',
        '- 다음 주 제안 2가지 (실행 가능한 형태)',
        '- 마지막 줄에 한 줄 격려',
        '평문 2~3 문단, 마크다운 헤딩은 쓰지 말 것.',
      ];

  const user = [
    ...taskLines,
    '',
    '데이터:',
    ...lines.map((l) => (l === '' ? '' : `- ${l}`)),
  ].join('\n');

  return { system, user };
}
