import { useRef, useState } from 'react'
import type { MarkdownEditorHandle } from './MarkdownEditor'
import type { HeadingLevel } from './editor/wysiwyg'
import Dropdown, { type DropdownOption } from './Dropdown'
import Dialog from './Dialog'
import { uploadMedia } from '@/lib/api'
import type { UploadTarget } from '@/lib/types'

type Props = {
  editorRef: React.RefObject<MarkdownEditorHandle | null>
  uploadTarget?: UploadTarget
  headingLevel?: HeadingLevel
}

type HeadingValue = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const HEADING_OPTIONS: DropdownOption<HeadingValue>[] = [
  { value: 'p', label: '단락' },
  { value: 'h1', label: '제목 1' },
  { value: 'h2', label: '제목 2' },
  { value: 'h3', label: '제목 3' },
  { value: 'h4', label: '제목 4' },
  { value: 'h5', label: '제목 5' },
  { value: 'h6', label: '제목 6' }
]

const TABLE_TEMPLATE = `| 헤더 1 | 헤더 2 | 헤더 3 |
| --- | --- | --- |
| 셀 | 셀 | 셀 |
| 셀 | 셀 | 셀 |`

function levelToValue(l: HeadingLevel): HeadingValue {
  return l === 0 ? 'p' : (`h${l}` as HeadingValue)
}

export default function FormatToolbar({ editorRef, uploadTarget, headingLevel = 0 }: Props) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  const [imgOpen, setImgOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [imgAlt, setImgAlt] = useState('')
  const [imgTitle, setImgTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const api = () => editorRef.current
  const wrap = (l: string, r?: string) => () => api()?.wrap(l, r)
  const prefix = (p: string) => () => api()?.prefixLines(p)
  const insert = (t: string) => () => api()?.insert(t)
  const insertBlock = (b: string) => () => api()?.insertBlock(b)

  const onHeading = (v: HeadingValue) => {
    const level = v === 'p' ? 0 : (Number(v.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6)
    api()?.setHeading(level)
  }

  const wrapAlign = (a: 'left' | 'center' | 'right') => () => {
    api()?.wrap(`<div align="${a}">`, '</div>')
  }

  const openLink = () => {
    const sel = api()?.getSelection() ?? ''
    setLinkText(sel)
    setLinkUrl('https://')
    setLinkOpen(true)
  }

  const submitLink = () => {
    const e = api()
    if (!e) return
    const url = linkUrl.trim()
    if (!url) return
    const text = linkText.trim() || url
    e.insert(`[${text}](${url})`)
    setLinkOpen(false)
  }

  const openImage = () => {
    setImgSrc('')
    setImgAlt('')
    setImgTitle('')
    setUploadErr(null)
    setImgOpen(true)
  }

  const submitImage = () => {
    const e = api()
    if (!e) return
    const src = imgSrc.trim()
    if (!src) return
    const alt = imgAlt.trim()
    const title = imgTitle.trim()
    const titleSuffix = title ? ` "${title.replace(/"/g, '\\"')}"` : ''
    e.insertBlock(`![${alt}](${src}${titleSuffix})`)
    setImgOpen(false)
  }

  const onPickFile = async (file: File) => {
    if (!uploadTarget) {
      setUploadErr('업로드 대상이 설정되지 않았습니다.')
      return
    }
    setUploading(true)
    setUploadErr(null)
    try {
      const result = await uploadMedia(uploadTarget, file)
      setImgSrc(result.relativePath)
      if (!imgAlt.trim()) {
        const stem = result.filename.replace(/\.[^.]+$/, '')
        setImgAlt(stem)
      }
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  const canUpload = Boolean(uploadTarget)
  const headingValue = levelToValue(headingLevel)

  return (
    <>
      <div className="format-toolbar" role="toolbar" aria-label="서식 도구">
        <Dropdown<HeadingValue>
          value={headingValue}
          options={HEADING_OPTIONS}
          onChange={onHeading}
          className="dd--plain"
        />

        <span className="format-toolbar__sep" />

        <button
          type="button"
          className="format-btn format-btn--bold"
          title="굵게  ** **"
          onClick={wrap('**')}
        >
          B
        </button>
        <button
          type="button"
          className="format-btn format-btn--italic"
          title="기울임  _ _"
          onClick={wrap('_')}
        >
          I
        </button>
        <button
          type="button"
          className="format-btn format-btn--strike"
          title="취소선  ~~ ~~"
          onClick={wrap('~~')}
        >
          S
        </button>
        <button
          type="button"
          className="format-btn format-btn--mono"
          title="인라인 코드  ` `"
          onClick={wrap('`')}
        >
          &lt;/&gt;
        </button>

        <span className="format-toolbar__sep" />

        <button type="button" className="format-btn" title="인용" onClick={prefix('> ')}>
          &ldquo;
        </button>
        <button type="button" className="format-btn" title="순서 없는 목록" onClick={prefix('- ')}>
          • 목록
        </button>
        <button
          type="button"
          className="format-btn"
          title="순서 있는 목록"
          onClick={prefix('1. ')}
        >
          1. 목록
        </button>
        <button
          type="button"
          className="format-btn"
          title="체크리스트"
          onClick={prefix('- [ ] ')}
        >
          ☐ 할 일
        </button>

        <span className="format-toolbar__sep" />

        <button
          type="button"
          className="format-btn"
          title="왼쪽 정렬 (<div align='left'>)"
          onClick={wrapAlign('left')}
        >
          ⇤
        </button>
        <button
          type="button"
          className="format-btn"
          title="가운데 정렬 (<div align='center'>)"
          onClick={wrapAlign('center')}
        >
          ↔
        </button>
        <button
          type="button"
          className="format-btn"
          title="오른쪽 정렬 (<div align='right'>)"
          onClick={wrapAlign('right')}
        >
          ⇥
        </button>

        <span className="format-toolbar__sep" />

        <button type="button" className="format-btn" title="링크 (URL 입력)" onClick={openLink}>
          링크
        </button>
        <button type="button" className="format-btn" title="이미지 삽입/업로드" onClick={openImage}>
          이미지
        </button>

        <span className="format-toolbar__sep" />

        <button
          type="button"
          className="format-btn"
          title="코드 블록"
          onClick={insert('\n```\n\n```\n')}
        >
          코드블록
        </button>
        <button
          type="button"
          className="format-btn"
          title="표 삽입"
          onClick={insertBlock(TABLE_TEMPLATE)}
        >
          표
        </button>
        <button
          type="button"
          className="format-btn"
          title="구분선"
          onClick={insert('\n\n---\n\n')}
        >
          ──
        </button>
      </div>

      <Dialog
        open={linkOpen}
        title="링크 삽입"
        submitLabel="삽입"
        onClose={() => setLinkOpen(false)}
        onSubmit={submitLink}
        submitDisabled={!linkUrl.trim()}
      >
        <label className="fm-field">
          <span>URL</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </label>
        <label className="fm-field">
          <span>표시 텍스트 (선택)</span>
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="비워두면 URL이 표시 텍스트로 사용됨"
          />
        </label>
      </Dialog>

      <Dialog
        open={imgOpen}
        title="이미지 삽입"
        submitLabel="삽입"
        onClose={() => setImgOpen(false)}
        onSubmit={submitImage}
        submitDisabled={!imgSrc.trim() || uploading}
      >
        <div className="fm-field">
          <span>파일 업로드</span>
          <div className="img-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) await onPickFile(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload || uploading}
            >
              {uploading ? '업로드 중…' : '파일 선택'}
            </button>
            <span className="fm-hint">
              {canUpload ? (
                <>현재 글의 <code>./assets/</code> 폴더로 올라갑니다.</>
              ) : (
                '업로드 대상이 아직 준비되지 않았습니다.'
              )}
            </span>
          </div>
          {uploadErr && <span className="fm-hint err-hint">{uploadErr}</span>}
        </div>
        <label className="fm-field">
          <span>경로 또는 URL</span>
          <input
            type="text"
            value={imgSrc}
            onChange={(e) => setImgSrc(e.target.value)}
            placeholder="./assets/example.png 또는 https://..."
            required
          />
        </label>
        <label className="fm-field">
          <span>대체 텍스트 (alt)</span>
          <input
            type="text"
            value={imgAlt}
            onChange={(e) => setImgAlt(e.target.value)}
            placeholder="스크린 리더와 캡션에 쓰입니다"
          />
        </label>
        <label className="fm-field">
          <span>제목 (선택)</span>
          <input
            type="text"
            value={imgTitle}
            onChange={(e) => setImgTitle(e.target.value)}
            placeholder="마우스 호버 시 표시"
          />
        </label>
      </Dialog>
    </>
  )
}
