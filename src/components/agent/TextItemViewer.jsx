import React, { useMemo } from 'react';
import { isHtml, sanitizeHtml } from '../../services/richText';
import { readOnlyGuard } from '../../services/copyGuard';

export function TextItemViewer({ content, title, hideHeader = false }) {
  // Items saved before the formatted reader are plain text and keep
  // rendering exactly as they always have.
  const html = useMemo(() => (isHtml(content) ? sanitizeHtml(content) : null), [content]);

  return (
    <div className="bg-[#F7F8ED] dark:bg-zinc-900 rounded-lg py-10 space-y-8 w-full">
      {!hideHeader && (
        <div className="pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs tabular-nums font-black text-watermelon-green-600 dark:text-watermelon-green-400 uppercase tracking-wider">
            ● READING MATERIAL & STANDARD OPERATING PROCEDURE
          </span>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {title}
          </h2>
        </div>
      )}

      {/* View-only: selection, copy, drag and the context menu are off, and
          the content is left out of printouts. */}
      <div {...readOnlyGuard} className="select-none no-print">
        {html ? (
          <div
            className="rich-text text-base text-zinc-800 dark:text-zinc-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {content || 'No content provided for this guide.'}
          </div>
        )}
      </div>
    </div>
  );
}
