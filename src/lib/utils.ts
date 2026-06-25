import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SITE_URL } from "@/lib/constants"

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
 * Build a fully-qualified absolute URL (for og:image, etc.).
 * - Already-absolute URLs (http/https) are returned unchanged.
 * - Relative paths are prefixed with the site origin (SITE_URL), accounting
 *   for BASE_URL, so they never double up as `${SITE_URL}/https://...`.
 */
export function toAbsoluteUrl(path: string): string {
  if (!path) return path
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const base = withBaseUrl(path) // normalize via BASE_URL
  const trimmed = base.startsWith("/") ? base.slice(1) : base
  return `${SITE_URL}/${trimmed}`
}

/**
 * Safely serialize JSON-LD for injection into <script type="application/ld+json">.
 *
 * Security analysis:
 * - JSON.stringify handles `\` and `"` escaping, so string breakout is not possible.
 * - The primary attack vector is `</script>` breakout: replacing `<` with `<`
 *   prevents the HTML parser from finding a closing tag inside the JSON string.
 * - `>` and `/` are also escaped as `>` / `/` for defense-in-depth,
 *   preventing `-->` comment termination and other edge cases in HTML context.
 * - No further escaping is needed; these three replacements are sufficient for
 *   embedding JSON inside a <script> tag.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
}
