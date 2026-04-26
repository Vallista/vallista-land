import matter from 'gray-matter';
import { writeDoc } from '../../lib/tauri';

export interface ParsedDoc {
  data: Record<string, unknown>;
  body: string;
}

export function parseDoc(raw: string): ParsedDoc {
  const parsed = matter(raw || '');
  const data = (parsed.data ?? {}) as Record<string, unknown>;
  return { data, body: parsed.content };
}

export function serializeDoc(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data);
}

export async function persistDoc(
  path: string,
  data: Record<string, unknown>,
  body: string,
): Promise<void> {
  await writeDoc(path, serializeDoc(data, body));
}
