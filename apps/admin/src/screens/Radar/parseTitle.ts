export interface ParsedTitle {
  breadcrumbs: string[];
  displayTitle: string;
}

export function parseTitle(raw: string): ParsedTitle {
  const bracketRe = /^(\[([^\]]+)\]\s*)+/;
  if (bracketRe.test(raw)) {
    const crumbs: string[] = [];
    const each = /\[([^\]]+)\]/g;
    let m: RegExpExecArray | null;
    let end = 0;
    while ((m = each.exec(raw)) !== null) {
      crumbs.push(m[1]!.trim());
      end = m.index + m[0].length;
    }
    const display = raw.slice(end).trim();
    if (display) return { breadcrumbs: crumbs, displayTitle: display };
  }

  if (raw.includes('/')) {
    const parts = raw.split('/').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const display = parts[parts.length - 1]!;
      const crumbs = parts.slice(0, -1);
      return { breadcrumbs: crumbs, displayTitle: display };
    }
  }

  return { breadcrumbs: [], displayTitle: raw };
}

export function breadcrumbKey(crumbs: string[]): string {
  return crumbs.join(' › ');
}
