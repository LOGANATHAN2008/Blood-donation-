import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error and component stack to the console
    console.error('ErrorBoundary caught error:', error);
    if (errorInfo?.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mb-4 shadow-sm border border-rose-200 dark:border-rose-900/40">
            🩸
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong loading this page
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mb-6 leading-relaxed">
            We encountered a temporary issue while displaying this screen. Please reload or return to home.
          </p>

          {isDev && this.state.error && (
            <div className="mb-6 max-w-lg w-full text-left p-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] font-mono text-rose-600 dark:text-rose-400 overflow-x-auto border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-1">Developer Notice:</div>
              <div>{this.state.error.toString()}</div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-105 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs border border-gray-200 dark:border-gray-700 transition"
            >
              Go to Home
            </a>
            <a
              href="/contact"
              className="px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:underline font-semibold text-xs transition"
            >
              Report Problem →
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
