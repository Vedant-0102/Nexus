import React, { Suspense } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Placeholder shown while a code-split app chunk is being fetched.
 *
 * Apps are loaded on first open (see the React.lazy registry in
 * WindowsContext), so this is visible for a moment on a cold open and not at
 * all afterwards, once the chunk is in the browser cache.
 */
const AppLoading: React.FC = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="text-xs">Loading…</span>
  </div>
);

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps a failed app from taking down the whole desktop.
 *
 * A chunk can fail to load for reasons unrelated to the app itself (a dropped
 * network connection, or a stale chunk reference after a redeploy), so the
 * failure is contained to the one window and offers a retry.
 */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App failed to render:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            This app failed to load.
          </p>
          <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Wraps window content with the loading placeholder and the error boundary. */
export const AppBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppErrorBoundary>
    <Suspense fallback={<AppLoading />}>{children}</Suspense>
  </AppErrorBoundary>
);

/**
 * An error boundary for purely decorative subtrees.
 *
 * WebGL is not available on every machine, and a driver failure in a
 * background effect should cost the user their wallpaper, not their desktop.
 * Renders nothing when its child throws.
 */
export class SilentBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Decorative layer disabled after an error:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
