import React from 'react';

export function TextItemViewer({ content, title, hideHeader = false }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg py-10 space-y-8 w-full">
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

      <div
        className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap"
      >
        {content || 'No content provided for this guide.'}
      </div>
    </div>
  );
}
