import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

const highlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.45em', fontWeight: '700', color: 'var(--ink)' },
  { tag: t.heading2, fontSize: '1.25em', fontWeight: '600', color: 'var(--ink)' },
  { tag: t.heading3, fontSize: '1.1em', fontWeight: '600', color: 'var(--ink)' },
  { tag: t.heading, fontWeight: '600', color: 'var(--ink)' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic', color: 'var(--ink-2)' },
  { tag: t.link, color: 'var(--blue)' },
  { tag: t.url, color: 'var(--blue)' },
  { tag: t.monospace, fontFamily: 'var(--font-mono)', color: 'var(--hl-cyan)' },
  { tag: t.quote, color: 'var(--ink-mute)', fontStyle: 'italic' },
  { tag: t.meta, color: 'var(--ink-faint)' },
  { tag: t.punctuation, color: 'var(--ink-mute)' },
  { tag: t.processingInstruction, color: 'var(--hl-violet)' },
]);

const baseTheme = EditorView.theme({
  '&': { height: '100%', background: 'transparent' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-sans)', lineHeight: '1.75' },
  '.cm-content': { padding: '12px 16px', caretColor: 'var(--ink)', color: 'var(--ink)' },
  '.cm-cursor': { borderLeftColor: 'var(--ink)' },
  '.cm-selectionBackground': { background: 'rgba(96,165,250,0.25) !important' },
  '&.cm-focused .cm-selectionBackground': { background: 'rgba(96,165,250,0.25) !important' },
  '.cm-activeLine': { background: 'transparent' },
  '.cm-placeholder': { color: 'var(--ink-faint)', fontStyle: 'italic' },
});

export const mdExtensions = [
  markdown({ base: markdownLanguage }),
  EditorView.lineWrapping,
  baseTheme,
  syntaxHighlighting(highlightStyle),
];

export const mdBasicSetup = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: true,
  bracketMatching: true,
  autocompletion: false,
  highlightActiveLine: false,
  highlightSelectionMatches: true,
  searchKeymap: false,
};
