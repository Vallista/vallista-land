import { useState } from 'react';
import type { Block, DocSummary, Mood } from '@vallista/content-core';
import { llmChat, llmStatus } from '../../lib/tauri';
import { Button, Mono } from '../../components/atoms/Atoms';

export interface WeeklyReviewInput {
  rangeLabel: string;
  blocks: Block[];
  moods: Mood[];
  publishedDocs: DocSummary[];
  totalDocs: DocSummary[];
  totalHours: number;
  deepHours: number;
  topKindHours: { kind: string; hours: number }[];
  topPeople: { name: string; count: number }[];
  topTags: { tag: string; n: number }[];
}

export function WeeklyReview({ input }: { input: WeeklyReviewInput }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await llmStatus();
      if (!status.running) {
        setError('LLM 서버가 꺼져 있습니다. LLM 설정에서 시작하세요.');
        setLoading(false);
        return;
      }
      const prompt = buildPrompt(input);
      const reply = await llmChat({
        messages: [
          {
            role: 'system',
            content:
              '당신은 사용자의 주간 활동을 따뜻하고 간결하게 돌아보는 코치입니다. 한국어로 답하세요.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        maxTokens: 480,
      });
      setText(reply.trim());
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '18px 22px',
        background: 'var(--blue-soft)',
        border: '1px solid rgba(96,165,250,0.22)',
        borderLeft: '3px solid var(--blue)',
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <Mono
          style={{
            fontSize: 10.5,
            color: 'var(--blue)',
            letterSpacing: '0.06em',
          }}
        >
          주간 리뷰 · LLM
        </Mono>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          {input.rangeLabel}
        </Mono>
        <span style={{ flex: 1 }} />
        <Button sm ghost onClick={generate} disabled={loading}>
          {loading ? '생성 중…' : text ? '다시 생성' : '리뷰 생성'}
        </Button>
      </div>

      {error && (
        <Mono style={{ fontSize: 11.5, color: 'var(--err)', display: 'block' }}>
          {error}
        </Mono>
      )}

      {!text && !error && !loading && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-soft)',
            lineHeight: 1.7,
          }}
        >
          이 기간의 블록·기분·발행을 기반으로 LLM이 짧은 회고와 다음 주 제안을 작성합니다.
          {' '}
          <span style={{ color: 'var(--ink-mute)' }}>
            ({input.blocks.length}개 블록 · {input.moods.length}일 컨디션 · {input.publishedDocs.length}편 발행)
          </span>
        </div>
      )}

      {text && (
        <div
          style={{
            fontSize: 14,
            color: 'var(--ink)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function buildPrompt(input: WeeklyReviewInput): string {
  const lines: string[] = [];
  lines.push(`기간: ${input.rangeLabel}`);
  lines.push(`총 기록 시간: ${input.totalHours.toFixed(1)}h`);
  lines.push(
    `딥워크(deep+write+build): ${input.deepHours.toFixed(1)}h (${
      input.totalHours > 0
        ? ((input.deepHours / input.totalHours) * 100).toFixed(1)
        : '0'
    }%)`,
  );
  lines.push(`발행: ${input.publishedDocs.length}편`);
  if (input.publishedDocs.length > 0) {
    const titles = input.publishedDocs.slice(0, 5).map((d) => `「${d.title}」`).join(', ');
    lines.push(`최근 발행: ${titles}`);
  }
  if (input.topKindHours.length > 0) {
    const top = input.topKindHours
      .slice(0, 5)
      .map((k) => `${k.kind} ${k.hours.toFixed(1)}h`)
      .join(', ');
    lines.push(`종류별 시간: ${top}`);
  }
  if (input.moods.length > 0) {
    const avgE =
      input.moods.reduce((a, m) => a + m.energy, 0) / input.moods.length;
    const avgM =
      input.moods.reduce((a, m) => a + m.mood, 0) / input.moods.length;
    lines.push(
      `평균 에너지 ${(avgE * 100).toFixed(0)}% / 평균 기분 ${(avgM * 100).toFixed(0)}%`,
    );
    const notes = input.moods
      .filter((m) => m.note && m.note.trim().length > 0)
      .slice(-5)
      .map((m) => `${m.date.slice(5)}: ${m.note}`);
    if (notes.length > 0) {
      lines.push(`기분 메모: ${notes.join(' / ')}`);
    }
  }
  if (input.topPeople.length > 0) {
    lines.push(
      `자주 만난 사람: ${input.topPeople
        .slice(0, 5)
        .map((p) => `${p.name}(${p.count}회)`)
        .join(', ')}`,
    );
  }
  if (input.topTags.length > 0) {
    lines.push(
      `자주 다룬 주제: ${input.topTags
        .slice(0, 5)
        .map((t) => `${t.tag}(${t.n})`)
        .join(', ')}`,
    );
  }
  return [
    '아래 데이터로 이번 기간의 활동을 따뜻하고 짧게 돌아봐줘.',
    '- 잘 풀린 부분 1~2가지 (구체적으로)',
    '- 다음 기간 제안 2가지 (실행 가능한 형태)',
    '- 마지막 줄에 한 줄 격려',
    '문단 1~2개로, 마크다운 헤딩은 쓰지 말고 평문으로.',
    '',
    '데이터:',
    ...lines.map((l) => `- ${l}`),
  ].join('\n');
}
