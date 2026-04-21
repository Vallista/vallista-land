// 한국어는 한 글자당 약 500자/분 정도. 영어는 약 200단어/분.
// body 텍스트에서 한글/영문 혼재를 간단히 추정.

const HANGUL_PER_MIN = 500
const ENGLISH_WPM = 200

export interface ReadingStats {
  minutes: number
  words: number
}

export function estimateReadingTime(body: string): ReadingStats {
  const stripped = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/<[^>]+>/g, '')

  const hangul = (stripped.match(/[\uAC00-\uD7AF]/g) ?? []).length
  const englishWords = stripped
    .replace(/[\uAC00-\uD7AF]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length

  const hangulMin = hangul / HANGUL_PER_MIN
  const englishMin = englishWords / ENGLISH_WPM
  const minutes = Math.max(1, Math.round(hangulMin + englishMin))
  const words = hangul + englishWords
  return { minutes, words }
}
