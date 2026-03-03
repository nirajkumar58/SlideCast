import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader } from './Loader'

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400'
}

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-10 px-4 py-2 rounded-md',
  lg: 'h-11 px-6 py-2.5 text-lg rounded-md'
}

export const Button = forwardRef(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  as = 'button',
  ...props
}, ref) => {
  const Component = typeof as === 'string' ? as : as

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium
    transition-colors duration-300 ease-in-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    select-none
  `

  const variantClasses = variants[variant] || variants.primary
  const sizeClasses = sizes[size] || sizes.md

  return (
    <Component
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader size="sm" className="mr-2 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />}
          {children}
        </>
      )}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button
