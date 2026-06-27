import { describe, it, expect } from 'vitest'
import { cn, withBaseUrl, toAbsoluteUrl, safeJsonLd } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8')
  })

  it('handles conditional classes', () => {
    const isHidden = false as boolean
    expect(cn('base', isHidden && 'hidden', 'end')).toBe('base end')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})

describe('withBaseUrl', () => {
  it('returns empty string unchanged', () => {
    expect(withBaseUrl('')).toBe('')
  })

  it('returns absolute http URLs unchanged', () => {
    expect(withBaseUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
  })

  it('returns absolute https URLs unchanged', () => {
    expect(withBaseUrl('https://cdn.example.com/img.png')).toBe('https://cdn.example.com/img.png')
  })

  it('prepends BASE_URL to relative path without leading slash', () => {
    // BASE_URL is "/" in test config
    expect(withBaseUrl('images/foo.png')).toBe('/images/foo.png')
  })

  it('strips leading slash to avoid double slash', () => {
    expect(withBaseUrl('/images/foo.png')).toBe('/images/foo.png')
  })

  it('handles BASE_URL with trailing slash', () => {
    // Default BASE_URL is "/", which already has trailing slash
    expect(withBaseUrl('data/file.json')).toBe('/data/file.json')
  })
})

describe('toAbsoluteUrl', () => {
  it('returns empty string unchanged', () => {
    expect(toAbsoluteUrl('')).toBe('')
  })

  it('returns absolute http URLs unchanged', () => {
    expect(toAbsoluteUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
  })

  it('returns absolute https URLs unchanged', () => {
    expect(toAbsoluteUrl('https://cdn.example.com/img.png')).toBe('https://cdn.example.com/img.png')
  })

  it('builds absolute URL from relative path', () => {
    expect(toAbsoluteUrl('images/foo.png')).toBe('https://howtocook.cn/images/foo.png')
  })

  it('builds absolute URL from path with leading slash', () => {
    expect(toAbsoluteUrl('/images/foo.png')).toBe('https://howtocook.cn/images/foo.png')
  })
})

describe('safeJsonLd', () => {
  it('serializes simple objects', () => {
    expect(safeJsonLd({ name: 'test' })).toBe('{"name":"test"}')
  })

  it('escapes < to prevent script breakout', () => {
    const result = safeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(result).not.toContain('</script>')
    expect(result).toContain('\\u003c')
  })

  it('escapes > for defense-in-depth', () => {
    const result = safeJsonLd({ name: 'a>b' })
    expect(result).not.toContain('>')
    expect(result).toContain('\\u003e')
  })

  it('escapes / to prevent --> comment termination', () => {
    const result = safeJsonLd({ name: '--></script>' })
    expect(result).not.toContain('-->')
    expect(result).toContain('\\u002f')
  })

  it('handles nested objects and arrays', () => {
    const obj = { items: ['<b>bold</b>'], meta: { key: 'a/b' } }
    const result = safeJsonLd(obj)
    expect(result).not.toContain('<b>')
    expect(result).not.toContain('</b>')
    expect(result).not.toContain('a/b')
    // Should be valid JSON after unescaping
    const unescaped = result
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u002f/g, '/')
    expect(JSON.parse(unescaped)).toEqual(obj)
  })

  it('handles null', () => {
    expect(safeJsonLd(null)).toBe('null')
  })

  it('handles strings with special chars', () => {
    const result = safeJsonLd('</script>')
    // JSON.stringify wraps in quotes, so the escaped output is a quoted string
    expect(result).toBe('"\\u003c\\u002fscript\\u003e"')
  })
})
