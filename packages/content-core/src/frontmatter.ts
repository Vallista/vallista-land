import matter from 'gray-matter';

export interface ParsedDoc<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T;
  body: string;
}

export function parse<T extends Record<string, unknown> = Record<string, unknown>>(
  raw: string,
): ParsedDoc<T> {
  const parsed = matter(raw);
  return { data: parsed.data as T, body: parsed.content };
}

export function serialize(input: { data: Record<string, unknown>; body: string }): string {
  return matter.stringify(input.body, input.data);
}

export function countWords(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`]/g, ' ');

  const tokens = stripped.match(/[A-Za-z0-9]+|[\u4E00-\u9FFF\uAC00-\uD7AF]/g);
  return tokens ? tokens.length : 0;
}
