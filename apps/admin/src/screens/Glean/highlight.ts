import type { GleanHighlight } from '@vallista/content-core';

export interface BodySegment {
  text: string;
  highlightIndex: number | null;
}

export function buildSegments(body: string, highlights: GleanHighlight[]): BodySegment[] {
  if (!body) return [];
  if (highlights.length === 0) return [{ text: body, highlightIndex: null }];

  type Range = { start: number; end: number; index: number };
  const ranges: Range[] = highlights
    .map((h, i) => ({
      start: clamp(h.range[0], 0, body.length),
      end: clamp(h.range[1], 0, body.length),
      index: i,
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const segs: BodySegment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) {
      segs.push({ text: body.slice(cursor, r.start), highlightIndex: null });
    }
    segs.push({ text: body.slice(r.start, r.end), highlightIndex: r.index });
    cursor = r.end;
  }
  if (cursor < body.length) {
    segs.push({ text: body.slice(cursor), highlightIndex: null });
  }
  return segs;
}

export function getTextOffset(root: HTMLElement, node: Node, offset: number): number {
  if (!root.contains(node)) return -1;
  let current = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === node) return current + offset;
    current += n.nodeValue?.length ?? 0;
  }
  return -1;
}

export function mergeHighlight(
  highlights: GleanHighlight[],
  start: number,
  end: number,
): GleanHighlight[] {
  if (end <= start) return highlights;
  const merged: GleanHighlight[] = [];
  let cur = { range: [start, end] as [number, number], note: undefined as string | undefined };
  const all = highlights.slice();
  let touchedNote: string | undefined;
  for (const h of all) {
    const [hs, he] = h.range;
    if (he < cur.range[0] || hs > cur.range[1]) {
      merged.push(h);
      continue;
    }
    cur = {
      range: [Math.min(cur.range[0], hs), Math.max(cur.range[1], he)],
      note: cur.note,
    };
    touchedNote = touchedNote ?? h.note;
  }
  if (touchedNote && !cur.note) cur.note = touchedNote;
  merged.push({ range: cur.range, note: cur.note });
  merged.sort((a, b) => a.range[0] - b.range[0]);
  return merged;
}

export function removeHighlight(
  highlights: GleanHighlight[],
  index: number,
): GleanHighlight[] {
  return highlights.filter((_, i) => i !== index);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
