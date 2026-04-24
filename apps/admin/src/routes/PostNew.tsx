import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createDraft, deleteDraft, finalizeDraft, getDraft, saveDraft } from '@/lib/api'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type Category,
  type UploadTarget
} from '@/lib/types'
import MarkdownEditor, { type MarkdownEditorHandle } from '@/components/MarkdownEditor'
import FormatToolbar from '@/components/FormatToolbar'
import type { HeadingLevel } from '@/components/editor/wysiwyg'
import FormSection from '@/components/FormSection'
import FrontmatterForm, {
  draftToFrontmatter,
  frontmatterToDraft,
  type FrontmatterDraft
} from '@/components/FrontmatterForm'
import { useCounts } from '@/state/CountsContext'

function isCategory(v: string | undefined): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

const SLUG_RE = /^[a-zA-Z0-9가-힣_\-]+$/

function todayIso(): string {
  return new Date().toISOString()
}

export default function PostNew() {
  const { category } = useParams<{ category: string }>()
  const [searchParams] = useSearchParams()
  const resumeDraftId = searchParams.get('draft')
  const navigate = useNavigate()
  const { refresh: refreshCounts } = useCounts()
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [fm, setFm] = useState<FrontmatterDraft>({
    title: '',
    date: todayIso(),
    description: '',
    image: '',
    seriesName: '',
    seriesOrder: '',
    tags: [],
    status: 'draft',
    draft: true,
    featured: false
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>(0)
  const [draftId, setDraftId] = useState<string | null>(null)
  const finalizedRef = useRef(false)
  const persistedRef = useRef(false)

  useEffect(() => {
    let alive = true
    if (resumeDraftId) {
      void getDraft(resumeDraftId)
        .then((d) => {
          if (!alive) return
          setDraftId(d.draftId)
          setSlug(d.slug)
          setContent(d.content)
          setFm((prev) => {
            const restored = frontmatterToDraft(d.frontmatter)
            return {
              ...prev,
              ...restored,
              title: d.title || restored.title,
              date: restored.date || prev.date
            }
          })
          persistedRef.current = true
        })
        .catch((e) => {
          if (alive) setErr(e instanceof Error ? e.message : String(e))
        })
    } else {
      void createDraft()
        .then((r) => {
          if (alive) setDraftId(r.draftId)
        })
        .catch((e) => {
          if (alive) setErr(e instanceof Error ? e.message : String(e))
        })
    }
    return () => {
      alive = false
    }
  }, [resumeDraftId])

  useEffect(() => {
    if (!draftId) return
    const onBeforeUnload = () => {
      if (!finalizedRef.current && !persistedRef.current) {
        void deleteDraft(draftId)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (!finalizedRef.current && !persistedRef.current) {
        void deleteDraft(draftId)
      }
    }
  }, [draftId])

  if (!isCategory(category)) {
    return <div className="err">알 수 없는 카테고리입니다.</div>
  }

  const slugValid = SLUG_RE.test(slug)
  const mediaBase = draftId ? `/api/drafts/${encodeURIComponent(draftId)}/media` : undefined
  const uploadTarget: UploadTarget | undefined = draftId
    ? { type: 'draft', draftId }
    : undefined

  const onSaveDraft = async () => {
    if (!draftId) {
      setErr('임시 작업 폴더가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    setErr(null)
    setSaveState('saving')
    try {
      await saveDraft(draftId, {
        category,
        slug,
        title: fm.title,
        frontmatter: draftToFrontmatter(fm, {}),
        content
      })
      persistedRef.current = true
      setSaveState('saved')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setSaveState('error')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!draftId) {
      setErr('임시 작업 폴더가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    if (!slugValid) {
      setErr('slug 형식이 올바르지 않습니다. 영문/숫자/한글/-/_ 만 허용.')
      return
    }
    if (!fm.title.trim()) {
      setErr('제목은 필수입니다.')
      return
    }
    setBusy(true)
    try {
      const frontmatter = draftToFrontmatter(fm, {})
      await finalizeDraft(draftId, {
        category,
        slug,
        frontmatter,
        content
      })
      finalizedRef.current = true
      void refreshCounts()
      navigate(`/posts/${category}/${encodeURIComponent(slug)}/edit`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="edit-page">
      <Link to={`/posts/${category}`} className="back">
        ← {CATEGORY_LABEL[category]} 목록
      </Link>
      <form className="page-head edit-head" onSubmit={onSubmit}>
        <div>
          <h1>새 글 · {CATEGORY_LABEL[category]}</h1>
          <div className="muted small meta-line">
            파일: <code>/contents/{category}/{slug || '<slug>'}/index.md</code>
            {draftId && (
              <>
                {' · '}
                <span className="muted">임시: <code>.drafts/{draftId}</code></span>
              </>
            )}
          </div>
        </div>
        <div className="edit-actions">
          {saveState !== 'idle' && (
            <span
              className={`save-badge save-badge--${
                saveState === 'saving'
                  ? 'saving'
                  : saveState === 'saved'
                    ? 'saved'
                    : 'error'
              }`}
            >
              {saveState === 'saving'
                ? '저장 중…'
                : saveState === 'saved'
                  ? '임시저장 완료'
                  : '저장 실패'}
            </span>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onSaveDraft}
            disabled={busy || !draftId || saveState === 'saving'}
          >
            임시저장
          </button>
          <button type="submit" className="btn" disabled={busy || !draftId}>
            {busy ? '생성 중…' : '생성하고 편집'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(`/posts/${category}`)}
          >
            취소
          </button>
        </div>
      </form>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="edit-grid">
        <section className="edit-pane edit-pane--editor">
          <div className="pane-head">마크다운</div>
          <FormatToolbar
            editorRef={editorRef}
            uploadTarget={uploadTarget}
            headingLevel={headingLevel}
          />
          <MarkdownEditor
            ref={editorRef}
            value={content}
            onChange={setContent}
            mediaBase={mediaBase}
            onHeadingLevelChange={setHeadingLevel}
          />
        </section>

        <aside className="edit-pane edit-pane--side">
          <div className="pane-head">기본 정보</div>
          <div className="fm-form">
            <FormSection title="파일 경로" required defaultOpen>
              <label className="fm-field">
                <span className="fm-field__label">
                  slug
                  <span className="fm-field__req" aria-label="필수">●</span>
                  <span className="fm-field__hint-inline">파일명으로 사용</span>
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-new-post"
                  autoFocus
                />
                {!slugValid && slug.length > 0 && (
                  <span className="fm-hint err-hint">영문/숫자/한글/-/_ 만 허용</span>
                )}
              </label>
            </FormSection>
          </div>
          <FrontmatterForm
            value={fm}
            onChange={setFm}
            uploadTarget={uploadTarget}
            imagePreviewBase={mediaBase}
            category={category}
            slug={slug}
          />
        </aside>
      </div>
    </div>
  )
}
