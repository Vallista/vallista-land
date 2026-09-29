import { useState } from 'react';
import type { GleanItem } from '@vallista/content-core';
import { openUrl } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  item: GleanItem;
};

export function ThreadsPostCard({ item }: Props) {
  const { text, images } = parseBody(item.body);
  const username = extractUsername(item.url);

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: 600,
      }}
    >
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'var(--bg-shade)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              color: 'var(--ink-mute)',
              flex: '0 0 36px',
            }}
          >
            ◎
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
                letterSpacing: '-0.1px',
              }}
            >
              {username || item.title || '(알 수 없음)'}
            </span>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {formatTime(item.fetchedAt)}
            </Mono>
          </div>
        </div>

        {text && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            {text}
          </p>
        )}
      </div>

      {images.length > 0 && <ImageGrid images={images} />}

      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
          {item.url ? (
            <button
              onClick={() => openUrl(item.url)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                cursor: 'pointer',
              }}
            >
              threads.net →
            </button>
          ) : (
            'threads'
          )}
        </Mono>
      </div>
    </div>
  );
}

export function ImageGrid({ images }: { images: string[] }) {
  const count = images.length;

  if (count === 1) {
    const only = images[0];
    if (!only) return null;
    return (
      <div style={{ padding: '0 18px 14px' }}>
        <div
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--line)',
            maxHeight: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-shade)',
          }}
        >
          <ThreadsImage
            src={only}
            style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div style={{ padding: '0 18px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--line)',
              background: 'var(--bg-shade)',
              aspectRatio: '1 / 1',
            }}
          >
            <ThreadsImage src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    );
  }

  // 3+: 첫 이미지 크게, 나머지 작은 그리드
  const [first, ...rest] = images;
  if (!first) return null;
  return (
    <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--bg-shade)',
          maxHeight: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ThreadsImage src={first} style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(rest.length, 3)}, 1fr)`,
          gap: 6,
        }}
      >
        {rest.slice(0, 3).map((src, i) => (
          <div
            key={i}
            style={{
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--line)',
              background: 'var(--bg-shade)',
              aspectRatio: '1 / 1',
            }}
          >
            <ThreadsImage src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThreadsImage({ src, style }: { src: string; style: React.CSSProperties }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      style={{ ...style, display: 'block', background: 'var(--bg-shade)' }}
      onError={() => setFailed(true)}
    />
  );
}

function parseBody(body: string): { text: string; images: string[] } {
  if (!body) return { text: '', images: [] };
  const lines = body.split('\n');
  const images: string[] = [];
  const textLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('[img]')) {
      images.push(line.slice(5).trim());
    } else {
      textLines.push(line);
    }
  }
  const raw = textLines.join('\n').trim();
  return { text: cleanThreadsText(raw), images };
}

export function cleanThreadsText(raw: string): string {
  if (!raw) return '';
  let s = raw;

  // ── 고정 포스트 표시 ──────────────────────────
  s = s.replace(/^Pin\s*icon고정됨/u, '');

  // ── 포스트 헤더 제거 ──────────────────────────
  // 형태 A: "username인증된 계정22시간더 보기content" (더 보기 있거나 없거나)
  s = s.replace(/^\S+인증된 계정\d+[분시간일주]+(더 보기)?/u, '');
  // 형태 B (개행): "username\n인증된 계정\nN시간\n더 보기\n"
  s = s.replace(/^[^\s\n]+\n인증된 계정\n\d+[분시간일주]+\n(더 보기\n)?/u, '');
  // 형태 C: 인증 배지 없이 username+타임스탬프 (예: "choi.openai53분")
  s = s.replace(/^[\w._가-힣@]+\d+[분시간일주]+(더 보기)?/u, '');
  // 형태 D: 개행 뒤 중간에 삽입된 username+타임스탬프 헤더 (임베드 포스트)
  s = s.replace(/\n[\w._가-힣@]+\d+[분시간일주]+(더 보기)?/gu, '\n');

  // ── 중간에 삽입된 인용/첨부 포스트 헤더 제거 ──
  // "오디오 소리 꺼짐username인증된 계정N시간..." 패턴
  s = s.replace(/오디오 소리 [꺼켜]짐\S*인증된 계정\d+[분시간일주]+/gu, '');
  s = s.replace(/오디오 소리 [꺼켜]짐/gu, '');

  // ── 참여 수치 제거 (한 줄에 붙어있는 형태) ────
  // "좋아요78댓글42리포스트5공유하기3" / "좋아요144댓글8리포스트20공유하기29"
  s = s.replace(/좋아요\d*댓글\d*리포스트\d*공유하기\d*/gu, '');
  // 숫자 없이 텍스트만: "좋아요댓글리포스트공유하기"
  s = s.replace(/좋아요댓글리포스트공유하기/gu, '');
  // 나머지 조각
  s = s.replace(/리포스트\d*공유하기\d*/gu, '');
  s = s.replace(/공유하기\d*/gu, '');

  // ── 투표 결과 제거 ────────────────────────────
  // "비개발자 (입문자)51%개발자49%" — % 2개 이상 포함하는 구간
  s = s.replace(/[^\n]*\d+%[^\n]*\d+%[^\n]*/gu, '');
  // "768표 · 01:51:01 후 종료"
  s = s.replace(/\d+표\s*·[^·\n]+후 종료/gu, '');

  // ── 단독 타임스탬프 제거 ──────────────────────
  // 개행 뒤 또는 줄 끝의 "22시간", "6분", "1일"
  s = s.replace(/(?:^|\n)\d+[분시간일주](?=\n|$)/gmu, '');

  // ── "더 보기" 제거 ────────────────────────────
  s = s.replace(/더 보기/gu, '');

  // ── "인증된 계정" 잔여 제거 ───────────────────
  s = s.replace(/인증된\s*계정/gu, '');

  // ── 여러 줄 공백 정리 ────────────────────────
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

function extractUsername(url: string): string {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/^\/@?([^/]+)/);
    return match ? `@${match[1]}` : '';
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
