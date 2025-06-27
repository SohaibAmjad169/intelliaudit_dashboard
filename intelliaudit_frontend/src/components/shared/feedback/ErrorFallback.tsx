
type ErrorFallbackProps = {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
};

export function ErrorFallback({ 
  error, 
  resetErrorBoundary, 
  message = 'There was an error loading this component.'
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10 dark:border-red-800/30">
      <h2 className="text-lg font-medium mb-2 text-red-700 dark:text-red-400">Something went wrong</h2>
      
      <p className="text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
        {message}
      </p>
      
      {error && (
        <pre className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-xs max-w-full overflow-auto my-2 text-red-800 dark:text-red-200">
          {error.message}
        </pre>
      )}
      
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mt-2 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorFallback; 