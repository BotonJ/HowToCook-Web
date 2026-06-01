import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function withBaseUrl(path: string) {
  if (!path) return path
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const baseUrl = import.meta.env.BASE_URL ?? "/"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  return `${normalizedBase}${normalizedPath}`
}

/**
 * Safely serialize JSON-LD for injection into <script type="application/ld+json">.
 * Escapes HTML-significant characters to prevent </script> breakout and XSS.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
}
