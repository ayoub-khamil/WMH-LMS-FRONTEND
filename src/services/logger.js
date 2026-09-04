/**
 * Single exit point for client-side errors.
 *
 * Scattered console.error calls are invisible in production - nobody is
 * watching a user's devtools. Routing them through here means wiring an error
 * reporter (Sentry, Rollbar, an internal endpoint) is a one-line change in
 * `install`, and every existing call site starts reporting.
 */

let reporter = null;

/**
 * Registers the production error reporter.
 * @param {(error: unknown, context: object) => void} fn
 */
export function installErrorReporter(fn) {
  reporter = typeof fn === 'function' ? fn : null;
}

export function reportError(error, context = {}) {
  if (import.meta.env.DEV) {
    console.error(context.message || 'Error:', error, context);
  }
  if (reporter) {
    try {
      reporter(error, context);
    } catch {
      // A failing reporter must never break the app it is reporting on.
    }
  }
}
