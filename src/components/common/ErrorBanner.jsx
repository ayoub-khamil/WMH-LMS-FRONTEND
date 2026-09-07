import React from 'react';
import { Button } from './Button';

// The classes of the banner this replaced in nine screens. They stay here
// until the token file and CSS Modules pass of a later phase.
const bannerClass =
  'p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold';

/**
 * One error surface for every screen. `error` is the ApiError a request threw,
 * or a plain string for a message composed in the UI. The reference line is
 * the correlation id the API logged the failure under: a user reads it out,
 * the maintainer searches the server logs for it.
 */
export function ErrorBanner({ error, onRetry, className = '' }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  const correlationId = typeof error === 'string' ? null : error.correlationId;

  return (
    <div role="alert" className={`${bannerClass} ${className}`.trim()}>
      <p>{message}</p>
      {correlationId && (
        <p className="mt-1 font-mono font-normal text-[11px] opacity-80">
          Reference: {correlationId}
        </p>
      )}
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
