import type { PostStatus, UploadTarget } from '@/lib/types'
import FormSection from './FormSection'
import DateField from './DateField'
import TagInput from './TagInput'
import SeriesInput from './SeriesInput'
import CoverImageField from './CoverImageField'
import SeoPreview from './SeoPreview'
import Dropdown, { type DropdownOption } from './Dropdown'
import { useTaxonomy } from '@/state/useTaxonomy'

export type FrontmatterDraft = {
  title: string
  date: string
  description: string
  image: string
  seriesName: string
  seriesOrder: string
  tags: string[]
  status: PostStatus
  draft: boolean
  featured: boolean
}

type Props = {
  value: FrontmatterDraft
  onChange: (next: FrontmatterDraft) => void
  uploadTarget?: UploadTarget
  imagePreviewBase?: string
  category: string
  slug: string
}

const STATUS_OPTIONS: readonly DropdownOption<PostStatus>[] = [
  { value: 'published', label: '공개' },
  { value: 'draft', label: '초안' },
  { value: 'trashed', label: '휴지통' }
]

function pickSeries(v: unknown): { name: string; order: string } {
  if (typeof v === 'string') return { name: v, order: '' }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    const name = typeof o.name === 'string' ? o.name : ''
    const ord = o.order ?? o.priority
    let order = ''
    if (typeof ord === 'number') order = String(ord)
    else if (typeof ord === 'string') order = ord
    return { name, order }
  }
  return { name: '', order: '' }
}

export function frontmatterToDraft(fm: Record<string, unknown>): FrontmatterDraft {
  const pickStr = (v: unknown): string => (typeof v === 'string' ? v : '')
  const pickDate = (v: unknown): string => {
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'string') return v
    return ''
  }
  const tagsArr = Array.isArray(fm.tags)
    ? (fm.tags.filter((t) => typeof t === 'string') as string[])
    : []
  const { name: seriesName, order: seriesOrder } = pickSeries(fm.series)
  const draft = fm.draft === true
  const statusFromData = typeof fm.status === 'string' ? (fm.status as PostStatus) : null
  const status: PostStatus = statusFromData ?? (draft ? 'draft' : 'published')
  return {
    title: pickStr(fm.title),
    date: pickDate(fm.date),
    description: pickStr(fm.description) || pickStr(fm.dek),
    image: pickStr(fm.image),
    seriesName,
    seriesOrder,
    tags: tagsArr,
    status,
    draft,
    featured: fm.featured === true
  }
}

export function draftToFrontmatter(
  d: FrontmatterDraft,
  base: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base }
  const setOrDelete = (k: string, v: string) => {
    if (v.trim() === '') delete next[k]
    else next[k] = v
  }
  setOrDelete('title', d.title)
  setOrDelete('date', d.date)
  setOrDelete('description', d.description)
  setOrDelete('image', d.image)

  if (d.tags.length === 0) delete next.tags
  else next.tags = d.tags

  if (d.seriesName.trim() === '') {
    delete next.series
  } else {
    const baseObj =
      base.series && typeof base.series === 'object' && !Array.isArray(base.series)
        ? (base.series as Record<string, unknown>)
        : {}
    const rest: Record<string, unknown> = { ...baseObj }
    delete rest.priority
    delete rest.order
    rest.name = d.seriesName
    if (d.seriesOrder.trim() !== '') {
      const n = Number(d.seriesOrder)
      rest.order = Number.isFinite(n) ? n : d.seriesOrder
    }
    next.series = rest
  }

  if (d.featured) next.featured = true
  else delete next.featured

  if (d.status === 'draft') {
    next.draft = true
    next.status = 'draft'
  } else if (d.status === 'trashed') {
    next.status = 'trashed'
    delete next.draft
  } else {
    delete next.draft
    delete next.status
  }

  return next
}

export default function FrontmatterForm({
  value,
  onChange,
  uploadTarget,
  imagePreviewBase,
  category,
  slug
}: Props) {
  const { data: taxonomy } = useTaxonomy()
  const set = <K extends keyof FrontmatterDraft>(k: K, v: FrontmatterDraft[K]) =>
    onChange({ ...value, [k]: v })

  const descLen = value.description.length
  const titleLen = value.title.length
  const seoBadge =
    !value.title || !value.description
      ? '확인 필요'
      : titleLen > 60 || descLen > 160 || descLen < 50
      ? '다듬기'
      : '양호'

  return (
    <div className="fm-form">
      <FormSection title="핵심" required defaultOpen>
        <label className="fm-field">
          <span className="fm-field__label">
            제목
            <span className="fm-field__req" aria-label="필수">●</span>
          </span>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="글 제목"
          />
        </label>

        <label className="fm-field">
          <span className="fm-field__label">
            요약
            <span className="fm-field__hint-inline">
              검색 결과·목록·OG 태그에 노출
            </span>
          </span>
          <textarea
            rows={3}
            value={value.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="한두 문장으로 글의 핵심을 설명"
          />
          <span className={descLen > 160 ? 'fm-hint err-hint' : 'fm-hint'}>
            {descLen} / 160자 (권장 50–160)
          </span>
        </label>
      </FormSection>

      <FormSection title="발행" defaultOpen>
        <div className="fm-row">
          <label className="fm-field">
            <span className="fm-field__label">작성일</span>
            <DateField value={value.date} onChange={(v) => set('date', v)} />
          </label>
          <div className="fm-field">
            <span className="fm-field__label">상태</span>
            <Dropdown<PostStatus>
              value={value.status}
              options={STATUS_OPTIONS}
              onChange={(v) => set('status', v)}
            />
          </div>
        </div>
        <label className="fm-check">
          <input
            type="checkbox"
            checked={value.featured}
            onChange={(e) => set('featured', e.target.checked)}
          />
          <span>
            <strong>Featured</strong>로 홈 상단에 고정
          </span>
        </label>
      </FormSection>

      <FormSection
        title="분류"
        hint="태그와 시리즈는 목록·사이드바·관련 글 탐색에 사용됩니다."
      >
        <div className="fm-field">
          <span className="fm-field__label">태그</span>
          <TagInput
            value={value.tags}
            onChange={(v) => set('tags', v)}
            suggestions={taxonomy?.tags ?? []}
          />
        </div>
        <div className="fm-field">
          <span className="fm-field__label">시리즈</span>
          <SeriesInput
            name={value.seriesName}
            priority={value.seriesOrder}
            onChange={({ name, priority }) =>
              onChange({ ...value, seriesName: name, seriesOrder: priority })
            }
            suggestions={taxonomy?.series ?? []}
          />
        </div>
      </FormSection>

      <FormSection title="커버 이미지" hint="카드 썸네일, 공유 OG 이미지로 사용">
        <CoverImageField
          value={value.image}
          onChange={(v) => set('image', v)}
          uploadTarget={uploadTarget}
          previewBase={imagePreviewBase}
        />
      </FormSection>

      <FormSection
        title="SEO 미리보기"
        badge={seoBadge}
        defaultOpen={false}
        hint="Google 검색 결과와 SNS 공유 카드에 어떻게 보이는지"
      >
        <SeoPreview
          title={value.title}
          description={value.description}
          slug={slug}
          category={category}
          image={value.image}
          imagePreview={value.image ? resolveImagePreview(value.image, imagePreviewBase) : ''}
        />
      </FormSection>
    </div>
  )
}

function resolveImagePreview(src: string, base?: string): string {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('//') || src.startsWith('data:')) return src
  if (src.startsWith('/')) return src
  if (!base) return ''
  const b = base.replace(/\/$/, '')
  const trimmed = src.replace(/^\.\//, '')
  const enc = trimmed.split('/').map((s) => encodeURIComponent(s)).join('/')
  return `${b}/${enc}`
}
