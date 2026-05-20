import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-display text-sm font-semibold transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100 disabled:pointer-events-none disabled:opacity-50 soft-lift',
  {
    variants: {
      variant: {
        primary: 'bg-rose-500/95 text-white shadow-[0_10px_30px_rgba(216,94,128,0.18)] hover:brightness-105 transform-gpu',
        ghost: 'border border-rose-100 bg-white/60 text-rose-600 hover:border-rose-200 hover:bg-white/70',
        accent: 'bg-amber-400 text-night hover:brightness-105',
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
