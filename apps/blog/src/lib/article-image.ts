// frontmatter image 값을 실제 로드 가능한 URL로 정규화한다.
//  - "https://..." / "http://..." / "//..." → 그대로
//  - "assets/https://..." 또는 "assets//..." (과거 migration 버그) → 내부 URL만 추출
//  - "assets/splash.jpg" 또는 "./assets/splash.jpg" → /contents/<collection>/<entryId>/assets/splash.jpg
//  - 나머지 → 그대로 (폴백)
export function normalizeArticleImage(
  value: string | undefined,
  entryId: string,
  collection: 'articles' | 'notes' = 'articles'
): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed
  }

  const bustedExternal = trimmed.match(/^assets\/(https?:\/\/.+|\/\/.+)$/i)
  if (bustedExternal && bustedExternal[1]) {
    return bustedExternal[1]
  }

  if (trimmed.startsWith('assets/') || trimmed.startsWith('./assets/')) {
    const stripped = trimmed.replace(/^\.\//, '').replace(/^assets\//, '')
    const segments = entryId.split('/').map(encodeURIComponent).join('/')
    return `/contents/${collection}/${segments}/assets/${stripped.split('/').map(encodeURIComponent).join('/')}`
  }

  return trimmed
}
