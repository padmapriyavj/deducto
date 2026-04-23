import type { HTMLAttributes } from 'react'

export type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Narrow column for auth / join flows */
  narrow?: boolean
  /** Vertically center content (auth cards) */
  centered?: boolean
}

export function PageContainer({
  narrow,
  centered,
  className = '',
  children,
  ...rest
}: PageContainerProps) {
  const max = narrow ? 'max-w-md' : 'max-w-6xl'
  const vertical = centered ? 'flex min-h-[calc(100svh-5.5rem)] flex-col justify-center py-8 sm:py-12' : ''
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 ${max} ${vertical} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}
