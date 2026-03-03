const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

// Custom keyframe animations
const loaderStyles = `
  @keyframes spin-pulse {
    0% {
      transform: rotate(0deg);
      opacity: 0.7;
    }
    50% {
      transform: rotate(180deg);
      opacity: 1;
    }
    100% {
      transform: rotate(360deg);
      opacity: 0.7;
    }
  }
  
  @keyframes pulse-ring {
    0% {
      transform: scale(0.95);
      opacity: 0.7;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.7;
    }
  }
  
  .loader-spin-pulse {
    animation: spin-pulse 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    transform-origin: center center;
  }
  
  .loader-pulse {
    animation: pulse-ring 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export const Loader = ({ size = 'md', className = '' }) => {
  return (
    <>
      <style>{loaderStyles}</style>
      <svg
        className={`loader-spin-pulse text-current ${sizes[size]} ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25 loader-pulse"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </>
  )
}

export const LoaderOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center shadow-lg transform transition-all">
        <Loader size="lg" className="text-blue-600 mx-auto" />
        <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  )
}

export const LoaderButton = ({
  loading,
  children,
  disabled,
  className = '',
  loadingText = 'Loading...',
  ...props
}) => {
  return (
    <button
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center transition-all duration-200
        ${loading ? 'cursor-wait' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader size="sm" className="mr-2 text-current" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Loader
