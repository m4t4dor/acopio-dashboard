import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = 'full' 
}: ResponsiveContainerProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto ${className}`}>
      {children}
    </div>
  )
}

export default ResponsiveContainer
