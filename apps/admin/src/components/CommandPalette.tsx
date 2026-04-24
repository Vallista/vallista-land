import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORY_LABEL } from '@/lib/types'
import {
  filterSearchItems,
  useSearchIndex,
  type SearchItem
} from '@/state/SearchIndex'

type Props = {
  open: boolean
  onClose: () => void
}

function itemHref(item: SearchItem): string {
  if (item.kind === 'post') {
    return `/posts/${item.category}/${encodeURIComponent(item.slug)}`
  }
  const cat = item.category ?? 'articles'
  return `/posts/${cat}/new?draft=${encodeURIComponent(item.draftId)}`
}

function itemKey(item: SearchItem): string {
  return item.kind === 'post'
    ? `post:${item.category}:${item.slug}`
    : `draft:${item.draftId}`
}

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { items: indexItems } = useSearchIndex()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(
    () => filterSearchItems(indexItems, query),
    [indexItems, query]
  )
  const drafts = results.filter((r) => r.kind === 'draft')
  const posts = results.filter((r) => r.kind === 'post')

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIdx(0)
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const go = (item: SearchItem) => {
    onClose()
    navigate(itemHref(item))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) setQuery('')
      else onClose()
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = results[activeIdx]
      if (picked) go(picked)
    }
  }

  return (
    <div
      className="palette-backdrop"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="palette"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="검색"
      >
        <div className="palette__input-row">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="글·임시저장 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="palette__esc">Esc</kbd>
        </div>

        <div className="palette__body">
          {!query.trim() ? (
            <div className="palette__hint">검색어를 입력하세요.</div>
          ) : results.length === 0 ? (
            <div className="palette__hint">검색 결과가 없습니다.</div>
          ) : (
            <>
              {drafts.length > 0 && (
                <div className="palette__group">
                  <div className="palette__label">임시저장</div>
                  {drafts.map((item) => {
                    const idx = results.indexOf(item)
                    return (
                      <PaletteRow
                        key={itemKey(item)}
                        item={item}
                        active={idx === activeIdx}
                        onHover={() => setActiveIdx(idx)}
                        onPick={() => go(item)}
                      />
                    )
                  })}
                </div>
              )}
              {posts.length > 0 && (
                <div className="palette__group">
                  <div className="palette__label">발행된 글</div>
                  {posts.map((item) => {
                    const idx = results.indexOf(item)
                    return (
                      <PaletteRow
                        key={itemKey(item)}
                        item={item}
                        active={idx === activeIdx}
                        onHover={() => setActiveIdx(idx)}
                        onPick={() => go(item)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="palette__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <em>이동</em>
          </span>
          <span>
            <kbd>⏎</kbd>
            <em>열기</em>
          </span>
          <span>
            <kbd>Esc</kbd>
            <em>닫기</em>
          </span>
        </div>
      </div>
    </div>
  )
}

type RowProps = {
  item: SearchItem
  active: boolean
  onHover: () => void
  onPick: () => void
}

function PaletteRow({ item, active, onHover, onPick }: RowProps) {
  const title = item.title.trim() || '(제목 없음)'
  const catLabel =
    item.kind === 'post'
      ? CATEGORY_LABEL[item.category]
      : item.category
        ? CATEGORY_LABEL[item.category]
        : '카테고리 미정'
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? 'palette__row palette__row--active' : 'palette__row'}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        e.preventDefault()
        onPick()
      }}
    >
      <span className="palette__row-title">{title}</span>
      <span className="palette__row-meta">
        <span>{catLabel}</span>
        {item.slug && <span className="palette__row-slug">{item.slug}</span>}
      </span>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.6 10.6 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
