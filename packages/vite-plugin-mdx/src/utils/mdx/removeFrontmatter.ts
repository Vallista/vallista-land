export function removeFrontmatter(mdx: string): string {
  if (!mdx.startsWith('---')) return mdx
  const end = mdx.indexOf('---', 3)
  return end !== -1 ? mdx.slice(end + 3).trimStart() : mdx
}
