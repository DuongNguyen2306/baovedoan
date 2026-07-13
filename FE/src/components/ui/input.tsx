import * as React from 'react'
import { cn } from '@/lib/utils'

const FIELD_BASE =
  'flex w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition ' +
  'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
  'dark:border-slate-700 dark:bg-slate-900/80'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        FIELD_BASE,
        'h-11 focus:border-accent focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        FIELD_BASE,
        'min-h-[88px] py-3 focus:border-accent focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        FIELD_BASE,
        'h-11 focus:border-accent focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}
