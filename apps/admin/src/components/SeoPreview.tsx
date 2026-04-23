type Props = {
  title: string
  description: string
  slug: string
  category: string
  image?: string
  imagePreview?: string
}

const SITE = 'vallista.kr'
const TITLE_LIMIT = 60
const DESC_LIMIT = 160

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1).trimEnd() + '…'
}

function lenState(len: number, min: number, max: number): 'ok' | 'warn' | 'bad' {
  if (len === 0) return 'bad'
  if (len < min) return 'warn'
  if (len > max) return 'warn'
  return 'ok'
}

export default function SeoPreview({
  title,
  description,
  slug,
  category,
  image,
  imagePreview
}: Props) {
  const displayTitle = title.trim() || '(제목 없음)'
  const displayDesc = description.trim() || '(요약이 비어 있습니다. description 필드는 목록·OG·검색 결과 요약으로 쓰입니다.)'
  const ogImage = imagePreview || image || ''

  const tState = lenState(title.length, 15, TITLE_LIMIT)
  const dState = lenState(description.length, 50, DESC_LIMIT)

  return (
    <div className="seo-preview">
      <div className="seo-preview__serp" aria-label="Google 검색 결과 미리보기">
        <div className="seo-preview__breadcrumb">
          <span className="seo-preview__site">{SITE}</span>
          <span className="seo-preview__sep">›</span>
          <span>{category}</span>
          {slug && (
            <>
              <span className="seo-preview__sep">›</span>
              <span>{slug}</span>
            </>
          )}
        </div>
        <div className="seo-preview__title">{truncate(displayTitle, TITLE_LIMIT)}</div>
        <div className="seo-preview__desc">{truncate(displayDesc, DESC_LIMIT)}</div>
      </div>

      <div className="seo-preview__og" aria-label="SNS 공유 카드 미리보기">
        {ogImage ? (
          <img src={ogImage} alt="" className="seo-preview__og-img" />
        ) : (
          <div className="seo-preview__og-placeholder">커버 이미지 없음</div>
        )}
        <div className="seo-preview__og-meta">
          <div className="seo-preview__og-site">{SITE}</div>
          <div className="seo-preview__og-title">{truncate(displayTitle, 80)}</div>
          <div className="seo-preview__og-desc">{truncate(displayDesc, 120)}</div>
        </div>
      </div>

      <div className="seo-preview__gauges">
        <Gauge
          label="제목"
          len={title.length}
          max={TITLE_LIMIT}
          state={tState}
          tip={`검색 결과에서 ${TITLE_LIMIT}자 이후 잘립니다`}
        />
        <Gauge
          label="요약"
          len={description.length}
          max={DESC_LIMIT}
          state={dState}
          tip={`meta description은 50~${DESC_LIMIT}자가 적당합니다`}
        />
      </div>
    </div>
  )
}

function Gauge({
  label,
  len,
  max,
  state,
  tip
}: {
  label: string
  len: number
  max: number
  state: 'ok' | 'warn' | 'bad'
  tip: string
}) {
  const pct = Math.min(100, (len / max) * 100)
  return (
    <div className={`seo-gauge seo-gauge--${state}`} title={tip}>
      <div className="seo-gauge__row">
        <span className="seo-gauge__label">{label}</span>
        <span className="seo-gauge__num">
          {len} / {max}
        </span>
      </div>
      <div className="seo-gauge__bar">
        <div className="seo-gauge__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
