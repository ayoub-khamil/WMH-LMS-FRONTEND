import React from 'react';

export function Badge({ variant = 'neutral', children, className = '' }) {
  const variants = {
    // ── Neutral / monochrome ──────────────────────────────────────────────────
    neutral:      'bg-[#F7F8ED]0 text-white dark:bg-zinc-600 dark:text-white',
    dark:         'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900',

    // ── Role badges (outlined to stay distinct from solid status pills) ──────
    role_agent:   'bg-transparent text-watermelon-green-700 border border-watermelon-green-500 dark:text-watermelon-green-300 dark:border-watermelon-green-500',
    role_manager: 'bg-transparent text-watermelon-red-600 border border-watermelon-red-500 dark:text-watermelon-red-300 dark:border-watermelon-red-500',

    // ── Assignment / progress statuses ────────────────────────────────────────
    completed:    'bg-[#4ADE80] text-white dark:bg-[#16a34a] dark:text-white',
    in_progress:  'bg-[#34d399] text-white dark:bg-[#059669] dark:text-white',
    not_started:  'bg-[#F7F8ED]0 text-white dark:bg-zinc-600 dark:text-white',

    // ── Course statuses ───────────────────────────────────────────────────────
    published:    'bg-[#4ADE80] text-white dark:bg-[#16a34a] dark:text-white',
    draft:        'bg-zinc-600 text-white dark:bg-[#F7F8ED]0 dark:text-white',

    // ── User statuses ─────────────────────────────────────────────────────────
    active:       'bg-[#4ADE80] text-white dark:bg-[#16a34a] dark:text-white',
    disabled:     'bg-[#f87171] text-white dark:bg-[#dc2626] dark:text-white',

    // ── Semantic accents ──────────────────────────────────────────────────────
    success:      'bg-[#4ADE80] text-white dark:bg-[#16a34a] dark:text-white',
    error:        'bg-[#f87171] text-white dark:bg-[#dc2626] dark:text-white',
    danger:       'bg-[#f87171] text-white dark:bg-[#dc2626] dark:text-white',
  };

  const selectedClass = variants[variant] || variants.neutral;

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${selectedClass} ${className}`}
    >
      {children}
    </span>
  );
}
