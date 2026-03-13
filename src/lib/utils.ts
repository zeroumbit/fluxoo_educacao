import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { APP_CONFIG } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat(APP_CONFIG.LOCALE, {
    style: 'currency',
    currency: APP_CONFIG.CURRENCY,
  }).format(amount || 0)
}

export function formatDate(date: string | Date | number, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  const d = typeof date === 'string' && !date.includes('T') ? new Date(date + 'T12:00:00') : new Date(date)
  return d.toLocaleDateString(APP_CONFIG.LOCALE, options)
}

export function formatDateTime(date: string | Date | number): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleString(APP_CONFIG.LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
