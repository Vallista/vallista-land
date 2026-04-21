// 마크다운 본문에서 간단한 플레인 텍스트 발췌 생성.
// - 코드 블록, 이미지, 링크 레이블 제거
// - heading/강조 기호 제거
// - 여러 공백/개행 압축
export function excerpt(body: string | undefined, maxChars = 160): string {
  if (!body) return ''
  const stripped = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^[>#\-*]\s+/gm, '')
    .replace(/\*\*|\*|__|_|~~/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped.length <= maxChars) return stripped
  return `${stripped.slice(0, maxChars).trim()}…`
}

// frontmatter.dek > frontmatter.description > body excerpt 순서로 fallback.
export function resolveDek(
  data: { dek?: string; description?: string },
  body: string | undefined,
  maxChars = 160
): string {
  const trimmed = (s: string | undefined) => (s ?? '').trim()
  return trimmed(data.dek) || trimmed(data.description) || excerpt(body, maxChars)
}
