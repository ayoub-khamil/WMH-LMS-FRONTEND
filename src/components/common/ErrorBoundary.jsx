import React from 'react';

/**
 * Last line of defence for a render-time exception.
 *
 * Without this, one thrown error unmounts the whole tree and the user is left
 * staring at a blank white page with no way back. Reset clears the error and
 * re-renders; Reload is the escape hatch when the failure is in shared state.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook an error reporter in here (Sentry et al.) when one is configured.
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F7F8ED] dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-4 p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            Something went wrong
          </h1>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            The page could not be displayed. Your progress is saved on the server,
            so nothing has been lost.
          </p>
          {import.meta.env.DEV && (
            <pre className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-950 text-xs text-watermelon-red-700 dark:text-watermelon-red-300 overflow-x-auto">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3.5 py-2 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-700 bg-[#F7F8ED] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="px-3.5 py-2 text-sm font-semibold rounded-md border border-watermelon-green-500 bg-watermelon-green-400 text-zinc-950 cursor-pointer"
            >
              Reload the app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
