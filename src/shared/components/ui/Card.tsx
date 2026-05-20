import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('glass-panel rounded-3xl p-6', className)} {...props} />
}
