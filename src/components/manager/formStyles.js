/**
 * Shared look for the item editor and its quiz editor. The page, the cards
 * and the fields used to share one cream fill with no borders, so a form
 * read as loose text on a flat background. Cards now sit on the page with a
 * border and a lighter fill, and every field has its own border and fill.
 */

/** A bordered panel that stands off the page, in a lighter tint of the page cream. */
export const CARD =
  'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#FBFCF6] dark:bg-zinc-900 p-5 space-y-4';

/** Card heading with a divider underneath. */
export const CARD_TITLE =
  'text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-3 border-b border-zinc-200 dark:border-zinc-800';

export const LABEL =
  'block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

export const HINT = 'text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5';

/** Text inputs and textareas. */
export const INPUT =
  'w-full px-3.5 py-2.5 text-sm font-medium rounded-lg bg-[#F7F8ED] dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-watermelon-green-500 focus:ring-2 focus:ring-watermelon-green-400/40 disabled:opacity-60 transition-colors';

/** Extra classes for the shared <Select> trigger so it matches INPUT. */
export const SELECT_BUTTON =
  'border border-zinc-300 dark:border-zinc-700 dark:!bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-600';

/** Empty preview area (no URL yet). */
export const PLACEHOLDER =
  'flex items-center justify-center text-center px-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-[#F7F8ED] dark:bg-zinc-950 text-xs font-medium text-zinc-500 dark:text-zinc-400';
