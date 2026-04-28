import yaml from 'js-yaml';
import { writeDoc } from '../../lib/tauri';

export interface ParsedDoc {
  data: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseDoc(raw: string): ParsedDoc {
  const text = raw ?? '';
  const m = FRONTMATTER_RE.exec(text);
  if (!m) return { data: {}, body: text };
  const yamlBody = m[1] ?? '';
  const body = text.slice(m[0].length);
  try {
    const loaded = yaml.load(yamlBody);
    if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
      return { data: loaded as Record<string, unknown>, body };
    }
    return { data: {}, body };
  } catch (err) {
    console.warn('parseDoc: YAML parse failed, preserving raw frontmatter', err);
    return { data: {}, body: text };
  }
}

export function serializeDoc(data: Record<string, unknown>, body: string): string {
  if (!data || Object.keys(data).length === 0) {
    return body;
  }
  const dumped = yaml
    .dump(data, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
      quotingType: '"',
    })
    .replace(/\n+$/, '');
  return `---\n${dumped}\n---\n${body.startsWith('\n') ? body.slice(1) : body}`;
}

export async function persistDoc(
  path: string,
  data: Record<string, unknown>,
  body: string,
): Promise<void> {
  await writeDoc(path, serializeDoc(data, body));
}
