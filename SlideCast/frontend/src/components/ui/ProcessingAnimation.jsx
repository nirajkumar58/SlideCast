import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export const ProcessingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30"></div>
      </div>
      <p className="mt-3 text-sm text-gray-600 animate-pulse">Processing your file...</p>
      
      {/* Progress bar */}
      <div className="w-full max-w-xs mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-progress-indeterminate"></div>
      </div>
      
      <div className="mt-4 space-y-2 w-full max-w-xs">
        <Step status="complete" text="Uploading file" delay="delay-0" />
        <Step status="current" text="Converting to PDF" delay="delay-200" />
        <Step status="waiting" text="Preparing for audio generation" delay="delay-400" />
      </div>
    </div>
  )
}

export const SuccessState = ({ message, children }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <CheckCircleIcon className="h-8 w-8 text-green-500" />
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      {children}
    </div>
  )
}

export const ErrorState = ({ message, children }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      {children}
    </div>
  )
}

const Step = ({ status, text, delay = "delay-0" }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'complete':
        return {
          icon: CheckCircleIcon,
          iconClass: 'text-green-500',
          textClass: 'text-gray-600',
          containerClass: 'opacity-100 translate-x-0'
        }
      case 'current':
        return {
          icon: ArrowPathIcon,
          iconClass: 'text-blue-500 animate-spin',
          textClass: 'text-blue-600 font-medium',
          containerClass: 'opacity-100 translate-x-0'
        }
      default:
        return {
          icon: CheckCircleIcon,
          iconClass: 'text-gray-300',
          textClass: 'text-gray-400',
          containerClass: 'opacity-80'
        }
    }
  }

  const { icon: Icon, iconClass, textClass, containerClass } = getStatusClasses()

  return (
    <div className={`flex items-center space-x-2 transition-all duration-500 ease-in-out ${containerClass} ${delay} animate-fade-in-right`}>
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <span className={`text-xs ${textClass}`}>{text}</span>
      {status === 'current' && (
        <span className="ml-1 flex space-x-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-delay-0"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-delay-300"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-delay-600"></span>
        </span>
      )}
    </div>
  )
}

// Add custom animation keyframes
const styles = `
  @keyframes progress-indeterminate {
    0% { width: 0%; left: -15%; }
    25% { width: 25%; }
    50% { width: 35%; left: 100%; }
    50.01% { left: -35%; }
    75% { width: 35%; }
    100% { width: 25%; left: 100%; }
  }

  @keyframes fade-in-right {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes pulse-delay-0 {
    0%, 100% { opacity: 0.5; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  @keyframes pulse-delay-300 {
    0%, 100% { opacity: 0.5; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  @keyframes pulse-delay-600 {
    0%, 100% { opacity: 0.5; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  .animate-progress-indeterminate {
    animation: progress-indeterminate 2s infinite linear;
    position: relative;
  }

  .animate-fade-in-right {
    animation: fade-in-right 0.6s ease-out forwards;
  }

  .animate-pulse-delay-0 {
    animation: pulse-delay-0 1.2s infinite;
  }

  .animate-pulse-delay-300 {
    animation: pulse-delay-300 1.2s infinite 0.3s;
  }

  .animate-pulse-delay-600 {
    animation: pulse-delay-600 1.2s infinite 0.6s;
  }

  .delay-0 { animation-delay: 0ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-400 { animation-delay: 400ms; }
`;

export default function ProcessingAnimationWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <ProcessingAnimation />
    </>
  );
}
