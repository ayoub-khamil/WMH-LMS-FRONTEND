import React from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { toEditableHtml } from '../../services/richText';

/**
 * Paste-and-publish editor for text items. A manager copies from Word,
 * Google Docs or a PDF and pastes: the schema keeps headings, emphasis,
 * lists, tables and links, and drops fonts, colours and images. The toolbar
 * is only for touch-ups. Lives in the manager chunk, so agents never load it.
 */
export function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ['http', 'https', 'mailto'],
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
        }
      }),
      TableKit.configure({ table: { resizable: false } })
    ],
    content: toEditableHtml(value),
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[320px] px-4 py-3 focus:outline-none',
        'aria-label': 'Text content'
      }
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.isEmpty ? '' : ed.getHTML());
    }
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive('bold') ?? false,
      italic: ed?.isActive('italic') ?? false,
      underline: ed?.isActive('underline') ?? false,
      h2: ed?.isActive('heading', { level: 2 }) ?? false,
      h3: ed?.isActive('heading', { level: 3 }) ?? false,
      bullet: ed?.isActive('bulletList') ?? false,
      ordered: ed?.isActive('orderedList') ?? false,
      link: ed?.isActive('link') ?? false,
      canUndo: ed?.can().undo() ?? false,
      canRedo: ed?.can().redo() ?? false
    })
  });

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('Link address (leave empty to remove the link)', previous);
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!url.trim()) chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  };

  const buttons = [
    { label: 'B', title: 'Bold', active: state.bold, run: () => editor.chain().focus().toggleBold().run(), className: 'font-black' },
    { label: 'I', title: 'Italic', active: state.italic, run: () => editor.chain().focus().toggleItalic().run(), className: 'italic font-serif' },
    { label: 'U', title: 'Underline', active: state.underline, run: () => editor.chain().focus().toggleUnderline().run(), className: 'underline' },
    { divider: true },
    { label: 'H2', title: 'Heading', active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', title: 'Subheading', active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { divider: true },
    { label: '• List', title: 'Bullet list', active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: '1. List', title: 'Numbered list', active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Link', title: 'Add or edit link', active: state.link, run: setLink },
    { divider: true },
    { label: 'Clear', title: 'Clear formatting', run: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
    { label: 'Undo', title: 'Undo', disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', title: 'Redo', disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() }
  ];

  return (
    <div className="rounded-lg bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-watermelon-green-400 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800" role="toolbar" aria-label="Formatting">
        {buttons.map((b, idx) =>
          b.divider ? (
            <span key={`d${idx}`} className="w-px h-5 mx-1 bg-zinc-200 dark:bg-zinc-700" />
          ) : (
            <button
              key={b.title}
              type="button"
              title={b.title}
              aria-pressed={b.active ?? undefined}
              disabled={b.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={b.run}
              className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-30 ${b.className || 'font-bold'} ${
                b.active
                  ? 'bg-watermelon-green-400 text-zinc-950'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
              }`}
            >
              {b.label}
            </button>
          )
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
