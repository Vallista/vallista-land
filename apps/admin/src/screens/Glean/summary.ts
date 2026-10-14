import type { GleanItem, GleanSummary } from '@vallista/content-core';

const IMG_MARKER = '[img]';
const PREVIEW_CHARS = 600;

// Rust `glean::summarize`와 같은 규칙. 화면에서 방금 쓴 항목을 목록에 끼워 넣을 때 쓴다
export function toSummary(item: GleanItem): GleanSummary {
  const lines = item.body ? item.body.split('\n') : [];
  const hasImage = lines.some((l) => l.startsWith(IMG_MARKER));
  const text = lines
    .filter((l) => !l.startsWith(IMG_MARKER))
    .join('\n')
    .trim();
  const preview =
    item.source === 'threads' && text
      ? Array.from(text).slice(0, PREVIEW_CHARS).join('')
      : undefined;
  return {
    id: item.id,
    url: item.url,
    source: item.source,
    title: item.title,
    excerpt: item.excerpt,
    fetchedAt: item.fetchedAt,
    status: item.status,
    promotedDocId: item.promotedDocId,
    digest: item.digest,
    feedId: item.feedId,
    externalId: item.externalId,
    publishedAt: item.publishedAt,
    preview,
    hasImage,
  };
}
