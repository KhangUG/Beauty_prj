import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-panel rounded-3xl p-6 shadow-[0_18px_50px_rgba(174,120,141,0.08)] transition-transform duration-300 transform-gpu soft-lift',
        className,
      )}
      {...props}
    />
  )
}
