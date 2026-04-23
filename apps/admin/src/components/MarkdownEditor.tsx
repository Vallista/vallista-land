import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { createWysiwyg, type HeadingLevel } from './editor/wysiwyg'

type Props = {
  value: string
  onChange: (v: string) => void
  minHeight?: string
  mediaBase?: string
  onHeadingLevelChange?: (level: HeadingLevel) => void
}

export type MarkdownEditorHandle = {
  wrap: (left: string, right?: string) => void
  prefixLines: (prefix: string) => void
  insert: (text: string) => void
  setHeading: (level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void
  insertBlock: (block: string) => void
  getSelection: () => string
  getView: () => EditorView | null
}

const theme = EditorView.theme({
  '&': { fontSize: '16px' },
  '.cm-gutters': { display: 'none' },
  '.cm-focused': { outline: 'none' },
  '.cm-line': { padding: '0' }
})

const MarkdownEditor = forwardRef<MarkdownEditorHandle, Props>(function MarkdownEditor(
  { value, onChange, minHeight = '560px', mediaBase, onHeadingLevelChange },
  ref
) {
  const cmRef = useRef<ReactCodeMirrorRef | null>(null)
  const levelCbRef = useRef(onHeadingLevelChange)

  useEffect(() => {
    levelCbRef.current = onHeadingLevelChange
  }, [onHeadingLevelChange])

  const extensions = useMemo(
    () => [
      markdown(),
      theme,
      EditorView.lineWrapping,
      ...createWysiwyg({
        ctx: { mediaBase },
        onHeadingLevelChange: (lv) => levelCbRef.current?.(lv)
      })
    ],
    [mediaBase]
  )

  useImperativeHandle(ref, () => ({
    getView: () => cmRef.current?.view ?? null,
    wrap(left: string, right: string = left) {
      const view = cmRef.current?.view
      if (!view) return
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const insertText = `${left}${selected}${right}`
      view.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + left.length, head: from + left.length + selected.length }
      })
      view.focus()
    },
    prefixLines(prefix: string) {
      const view = cmRef.current?.view
      if (!view) return
      const { from, to } = view.state.selection.main
      const startLine = view.state.doc.lineAt(from)
      const endLine = view.state.doc.lineAt(to)
      const changes: { from: number; insert: string }[] = []
      for (let ln = startLine.number; ln <= endLine.number; ln++) {
        const line = view.state.doc.line(ln)
        changes.push({ from: line.from, insert: prefix })
      }
      view.dispatch({ changes })
      view.focus()
    },
    insert(text: string) {
      const view = cmRef.current?.view
      if (!view) return
      const { from, to } = view.state.selection.main
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length }
      })
      view.focus()
    },
    setHeading(level) {
      const view = cmRef.current?.view
      if (!view) return
      const { from, to } = view.state.selection.main
      const startLine = view.state.doc.lineAt(from)
      const endLine = view.state.doc.lineAt(to)
      const newPrefix = level > 0 ? `${'#'.repeat(level)} ` : ''
      const changes: { from: number; to: number; insert: string }[] = []
      for (let ln = startLine.number; ln <= endLine.number; ln++) {
        const line = view.state.doc.line(ln)
        const m = /^#{1,6}\s+/.exec(line.text)
        const oldLen = m ? m[0].length : 0
        changes.push({ from: line.from, to: line.from + oldLen, insert: newPrefix })
      }
      view.dispatch({ changes })
      view.focus()
    },
    insertBlock(block: string) {
      const view = cmRef.current?.view
      if (!view) return
      const { from, to } = view.state.selection.main
      const startLine = view.state.doc.lineAt(from)
      const endLine = view.state.doc.lineAt(to)
      const before = startLine.from > 0 ? '\n\n' : ''
      const afterNeeded = endLine.to < view.state.doc.length
      const after = afterNeeded ? '\n\n' : '\n'
      const insertText = `${before}${block}${after}`
      view.dispatch({
        changes: { from: endLine.to, to: endLine.to, insert: insertText },
        selection: { anchor: endLine.to + insertText.length }
      })
      view.focus()
    },
    getSelection() {
      const view = cmRef.current?.view
      if (!view) return ''
      const { from, to } = view.state.selection.main
      return view.state.sliceDoc(from, to)
    }
  }))

  return (
    <div className="editor-wrap" style={{ minHeight }}>
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          highlightSelectionMatches: false,
          drawSelection: true
        }}
        theme="none"
      />
    </div>
  )
})

export default MarkdownEditor
