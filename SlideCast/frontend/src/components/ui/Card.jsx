import { forwardRef } from 'react'

export const Card = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 ${className}`}
      {...props}
    />
  )
})

Card.displayName = 'Card'

export const CardHeader = ({ className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-5 flex flex-col space-y-1.5 border-b border-gray-100 ${className}`}
      {...props}
    />
  )
}

export const CardTitle = ({ className = '', ...props }) => {
  return (
    <h3
      className={`text-lg font-medium leading-none tracking-tight text-gray-900 ${className}`}
      {...props}
    />
  )
}

export const CardDescription = ({ className = '', ...props }) => {
  return (
    <p
      className={`text-sm text-gray-500 leading-relaxed ${className}`}
      {...props}
    />
  )
}

export const CardContent = ({ className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-5 pt-0 ${className}`}
      {...props}
    />
  )
}

export const CardFooter = ({ className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 flex items-center border-t border-gray-100 ${className}`}
      {...props}
    />
  )
}

export default Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter
})
