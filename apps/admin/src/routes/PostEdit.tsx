import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPost, movePost, savePost, trashPost } from '@/lib/api'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type Category,
  type PostFull,
  type UploadTarget
} from '@/lib/types'
import MarkdownEditor, { type MarkdownEditorHandle } from '@/components/MarkdownEditor'
import MarkdownPreview from '@/components/MarkdownPreview'
import FormatToolbar from '@/components/FormatToolbar'
import type { HeadingLevel } from '@/components/editor/wysiwyg'
import FrontmatterForm, {
  draftToFrontmatter,
  frontmatterToDraft,
  type FrontmatterDraft
} from '@/components/FrontmatterForm'
import Dropdown, { type DropdownOption } from '@/components/Dropdown'
import { useCounts } from '@/state/CountsContext'

function isCategory(v: string | undefined): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'dirty' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: number }
  | { kind: 'error'; message: string }

const AUTOSAVE_MS = 2000

export default function PostEdit() {
  const { category, slug } = useParams<{ category: string; slug: string }>()
  const navigate = useNavigate()
  const { refresh: refreshCounts } = useCounts()
  const [post, setPost] = useState<PostFull | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [fm, setFm] = useState<FrontmatterDraft | null>(null)
  const [baseFm, setBaseFm] = useState<Record<string, unknown>>({})
  const [hash, setHash] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const timerRef = useRef<number | null>(null)
  const dirtyRef = useRef(false)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const [tab, setTab] = useState<'source' | 'preview'>('source')
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>(0)

  useEffect(() => {
    if (!isCategory(category) || !slug) return
    setPost(null)
    setErr(null)
    getPost(category, slug)
      .then((p) => {
        setPost(p)
        setContent(p.content)
        setHash(p.hash)
        setBaseFm(p.data)
        setFm(frontmatterToDraft(p.data))
        setSaveState({ kind: 'idle' })
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [category, slug])

  const doSave = useCallback(async () => {
    if (!isCategory(category) || !slug || !fm) return
    setSaveState({ kind: 'saving' })
    try {
      const frontmatter = draftToFrontmatter(fm, baseFm)
      const updated = await savePost(category, slug, {
        content,
        frontmatter,
        expectedHash: hash
      })
      setHash(updated.hash)
      setBaseFm(updated.data)
      setPost(updated)
      dirtyRef.current = false
      setSaveState({ kind: 'saved', at: Date.now() })
      void refreshCounts()
    } catch (e) {
      setSaveState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }, [category, slug, fm, baseFm, content, hash, refreshCounts])

  useEffect(() => {
    if (!dirtyRef.current) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void doSave()
    }, AUTOSAVE_MS)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [content, fm, doSave])

  const onContentChange = (v: string) => {
    setContent(v)
    dirtyRef.current = true
    setSaveState({ kind: 'dirty' })
  }
  const onFmChange = (next: FrontmatterDraft) => {
    setFm(next)
    dirtyRef.current = true
    setSaveState({ kind: 'dirty' })
  }

  const saveLabel = useMemo(() => {
    switch (saveState.kind) {
      case 'idle':
        return '저장됨'
      case 'dirty':
        return '변경됨 · 자동저장 대기'
      case 'saving':
        return '저장 중…'
      case 'saved':
        return `저장됨 · ${new Date(saveState.at).toLocaleTimeString()}`
      case 'error':
        return `오류: ${saveState.message}`
    }
  }, [saveState])

  const moveOptions = useMemo<DropdownOption<Category>[]>(() => {
    if (!isCategory(category)) return []
    return CATEGORIES.filter((c) => c !== category).map((c) => ({
      value: c,
      label: CATEGORY_LABEL[c]
    }))
  }, [category])

  if (!isCategory(category) || !slug) {
    return <div className="err">잘못된 경로입니다.</div>
  }
  if (err) return <div className="err">오류: {err}</div>
  if (!post || !fm) return <div className="muted">불러오는 중…</div>

  const mediaBase = `/api/media/${category}/${encodeURIComponent(slug)}`
  const uploadTarget: UploadTarget = { type: 'post', category, slug }

  return (
    <div className="edit-page">
      <Link to={`/posts/${category}/${encodeURIComponent(slug)}`} className="back">
        ← {CATEGORY_LABEL[category]} / {slug}
      </Link>
      <header className="page-head edit-head">
        <div>
          <h1>편집</h1>
          <div className="muted small meta-line">
            <code>{post.filePath}</code>
          </div>
        </div>
        <div className="edit-actions">
          <span
            className={`save-badge save-badge--${saveState.kind}`}
            aria-live="polite"
          >
            {saveLabel}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => void doSave()}
            disabled={saveState.kind === 'saving'}
          >
            지금 저장
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(`/posts/${category}/${encodeURIComponent(slug)}`)}
          >
            닫기
          </button>
        </div>
      </header>

      <div className="danger-zone">
        <div className="danger-zone__label">이동 · 삭제</div>
        <div className="danger-zone__actions">
          <Dropdown<Category>
            value=""
            options={moveOptions}
            placeholder="다른 카테고리로 이동…"
            onChange={(target) => {
              if (!target || target === category) return
              if (
                !window.confirm(
                  `${slug} 글을 ${CATEGORY_LABEL[target]}(으)로 이동합니다. 계속할까요?`
                )
              ) {
                return
              }
              void movePost(category, slug, target).then((meta) => {
                void refreshCounts()
                navigate(`/posts/${meta.category}/${encodeURIComponent(meta.slug)}/edit`)
              })
            }}
          />
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              if (
                window.confirm(
                  `${slug} 글을 휴지통으로 이동합니다 (contents/.trash/). 계속할까요?`
                )
              ) {
                void trashPost(category, slug).then(() => {
                  void refreshCounts()
                  navigate(`/posts/${category}`)
                })
              }
            }}
          >
            휴지통으로 이동
          </button>
        </div>
      </div>

      <div className="edit-grid">
        <section className="edit-pane edit-pane--editor">
          <div className="pane-head pane-head--tabs">
            <button
              type="button"
              className={tab === 'source' ? 'tab tab--active' : 'tab'}
              onClick={() => setTab('source')}
            >
              마크다운
            </button>
            <button
              type="button"
              className={tab === 'preview' ? 'tab tab--active' : 'tab'}
              onClick={() => setTab('preview')}
            >
              미리보기
            </button>
          </div>
          {tab === 'source' && (
            <>
              <FormatToolbar
                editorRef={editorRef}
                uploadTarget={uploadTarget}
                headingLevel={headingLevel}
              />
              <MarkdownEditor
                ref={editorRef}
                value={content}
                onChange={onContentChange}
                mediaBase={mediaBase}
                onHeadingLevelChange={setHeadingLevel}
              />
            </>
          )}
          {tab === 'preview' && (
            <MarkdownPreview
              source={content}
              mediaBase={mediaBase}
              title={fm.title}
              dek={fm.description}
              date={fm.date}
              tags={fm.tags}
              series={fm.seriesName}
              image={fm.image}
            />
          )}
        </section>

        <aside className="edit-pane edit-pane--side">
          <div className="pane-head">Frontmatter</div>
          <FrontmatterForm
            value={fm}
            onChange={onFmChange}
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
