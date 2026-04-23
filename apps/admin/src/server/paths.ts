import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { CATEGORIES as _CATEGORIES, type Category } from '../lib/types'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const DEFAULT_REPO_ROOT = resolve(HERE, '../../../..')

export const REPO_ROOT = process.env.VALLISTA_REPO_ROOT
  ? resolve(process.env.VALLISTA_REPO_ROOT)
  : DEFAULT_REPO_ROOT
export const CONTENTS_ROOT = resolve(REPO_ROOT, 'contents')
export const TRASH_ROOT = resolve(CONTENTS_ROOT, '.trash')
export const DRAFTS_ROOT = resolve(CONTENTS_ROOT, '.drafts')

export const CATEGORIES = _CATEGORIES
export type { Category }

export function categoryDir(cat: Category): string {
  return resolve(CONTENTS_ROOT, cat)
}
