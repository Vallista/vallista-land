import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { useDoc } from './state';

export function LayoutEditor() {
  const { body, setBody } = useDoc();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        breaks: false,
        tightLists: true,
        bulletListMarker: '-',
      }),
    ],
    content: body,
    onUpdate: ({ editor }) => {
      const storage = editor.storage as unknown as { markdown: { getMarkdown: () => string } };
      setBody(storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'pensmith-tiptap',
      },
    },
  });

  if (!editor) {
    return (
      <div style={{ padding: 40, color: 'var(--ink-mute)', fontSize: 13 }}>
        레이아웃 에디터 준비 중…
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <style>{tiptapCss}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

const tiptapCss = `
.pensmith-tiptap {
  outline: none;
  padding: 24px 64px 60px;
  font-family: var(--font-serif);
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
  word-break: keep-all;
  overflow-wrap: break-word;
  caret-color: var(--ink);
}
.pensmith-tiptap > *:first-child { margin-top: 0; }
.pensmith-tiptap h1, .pensmith-tiptap h2, .pensmith-tiptap h3, .pensmith-tiptap h4 {
  font-family: var(--font-serif);
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.3;
  margin: 1.4em 0 0.4em;
  color: var(--ink);
}
.pensmith-tiptap h1 { font-size: 26px; }
.pensmith-tiptap h2 { font-size: 21px; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.pensmith-tiptap h3 { font-size: 18px; }
.pensmith-tiptap h4 { font-size: 16px; }
.pensmith-tiptap p { margin: 0.7em 0; }
.pensmith-tiptap a { color: var(--blue); text-decoration: underline; }
.pensmith-tiptap ul, .pensmith-tiptap ol {
  margin: 0.7em 0;
  padding-left: 1.4em;
}
.pensmith-tiptap li { margin: 0.25em 0; }
.pensmith-tiptap li > p { margin: 0; }
.pensmith-tiptap blockquote {
  margin: 0.9em 0;
  padding: 4px 14px;
  border-left: 3px solid var(--line);
  color: var(--ink-mute);
  font-style: italic;
}
.pensmith-tiptap code {
  font-family: var(--font-mono);
  font-size: 12.5px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}
.pensmith-tiptap pre {
  font-family: var(--font-mono);
  font-size: 12.5px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 12px 14px;
  overflow-x: auto;
  line-height: 1.55;
}
.pensmith-tiptap pre code {
  background: transparent;
  border: none;
  padding: 0;
  font-size: inherit;
}
.pensmith-tiptap hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1.5em 0;
}
.pensmith-tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.pensmith-tiptap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin: 0.9em 0;
}
.pensmith-tiptap th, .pensmith-tiptap td {
  padding: 6px 10px;
  border: 1px solid var(--line);
  text-align: left;
}
.pensmith-tiptap th { background: var(--bg-soft); font-weight: 600; }
.pensmith-tiptap p.is-editor-empty:first-child::before {
  content: '본문을 입력하세요…';
  float: left;
  color: var(--ink-faint);
  pointer-events: none;
  height: 0;
}
.pensmith-tiptap ::selection { background: var(--blue-soft); }
`;
