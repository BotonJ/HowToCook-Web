import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchRecipes, getRecipeDetail, fetchAllRecipes, fetchCategories } from './api'

function mockFetch(body: unknown, init?: ResponseInit) {
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), init)) as unknown as typeof globalThis.fetch
}

function mockFetchSequence(responses: Array<{ body: unknown; init?: ResponseInit }>) {
  let i = 0
  globalThis.fetch = vi.fn(async () => {
    const { body, init } = responses[Math.min(i++, responses.length - 1)]
    return new Response(JSON.stringify(body), init)
  }) as unknown as typeof globalThis.fetch
}

describe('searchRecipes', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('builds query params and returns results', async () => {
    const response = { results: [{ id: 'r1', name: '红烧肉' }], total: 1, query: {} }
    mockFetch(response)

    const result = await searchRecipes({ q: '红烧肉' })
    expect(result.results).toHaveLength(1)

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('/search?')
    expect(url).toContain('q=%E7%BA%A2%E7%83%A7%E8%82%89')
  })

  it('sanitizes query (trims, strips control chars, limits length)', async () => {
    mockFetch({ results: [], total: 0, query: {} })
    await searchRecipes({ q: '  test\x00\x01  ' })

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('q=test') // control chars stripped, trimmed
  })

  it('skips empty q after sanitization', async () => {
    mockFetch({ results: [], total: 0, query: {} })
    await searchRecipes({ q: '\x00\x01' })

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).not.toContain('q=')
  })

  it('passes optional filters', async () => {
    mockFetch({ results: [], total: 0, query: {} })
    await searchRecipes({ category: 'meat', cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', limit: 10 })

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('category=meat')
    expect(url).toContain('cuisine=Hunan')
    expect(url).toContain('cooking_method=braise')
    expect(url).toContain('cook_time=60min')
    expect(url).toContain('limit=10')
  })

  it('throws on non-ok response', async () => {
    mockFetch({ error: 'not found' }, { status: 404 })
    await expect(searchRecipes({ q: 'test' })).rejects.toThrow('API error: 404')
  })
})

describe('getRecipeDetail', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('fetches recipe by encoded id', async () => {
    const detail = { id: '西红柿炒鸡蛋', name: '西红柿炒鸡蛋', category: 'meat' }
    mockFetch(detail)

    const result = await getRecipeDetail('西红柿炒鸡蛋')
    expect(result.name).toBe('西红柿炒鸡蛋')

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('/recipe/')
    expect(url).toContain(encodeURIComponent('西红柿炒鸡蛋'))
  })

  it('throws on non-ok response', async () => {
    mockFetch({ error: 'not found' }, { status: 404 })
    await expect(getRecipeDetail('nonexistent')).rejects.toThrow('API error: 404')
  })
})

describe('fetchApi timeout (AbortError)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('throws user-friendly message on AbortError', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }) as unknown as typeof globalThis.fetch

    await expect(fetchCategories()).rejects.toThrow('Request timed out, please try again later')
  })

  it('re-throws non-AbortError errors', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof globalThis.fetch

    await expect(fetchCategories()).rejects.toThrow('Failed to fetch')
  })
})

describe('fetchAllRecipes', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('fetches all recipes in a single page', async () => {
    mockFetch({
      recipes: [{ id: 'r1', name: '红烧肉' }],
      total: 1,
      pagination: { page: 1, limit: 2000, total: 1, pages: 1 },
    })

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
  })

  it('paginates when first page is full', async () => {
    const recipes1 = Array.from({ length: 2000 }, (_, i) => ({ id: `r${i}`, name: `dish${i}` }))
    const recipes2 = [{ id: 'r2000', name: 'last dish' }]

    mockFetchSequence([
      { body: { recipes: recipes1, total: 2001, pagination: { page: 1, limit: 2000, total: 2001, pages: 2 } } },
      { body: { recipes: recipes2, total: 2001, pagination: { page: 2, limit: 2000, total: 2001, pages: 2 } } },
    ])

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(2001)
  })

  it('stops at safety cap (page > 20)', async () => {
    // Return full pages every time to trigger pagination
    const fullPage = Array.from({ length: 2000 }, (_, i) => ({ id: `r${i}`, name: `dish${i}` }))
    mockFetch({
      recipes: fullPage,
      total: 100_000, // huge total to keep paginating
      pagination: { page: 1, limit: 2000, total: 100_000, pages: 50 },
    })

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await fetchAllRecipes()

    // Should have stopped at page 20
    expect(result).toHaveLength(2000 * 20)
    expect(consoleSpy).toHaveBeenCalledWith('[fetchAllRecipes] pagination safety cap reached')
    consoleSpy.mockRestore()
  })

  it('stops when page returns empty', async () => {
    mockFetchSequence([
      { body: { recipes: [{ id: 'r1' }], total: 1 } },
      { body: { recipes: [], total: 1 } },
    ])

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(1)
  })

  it('uses total field as fallback when pagination is missing', async () => {
    mockFetchSequence([
      { body: { recipes: [{ id: 'r1' }], total: 1 } },
      { body: { recipes: [], total: 1 } },
    ])

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(1)
  })

  it('stops once accumulated count reaches total (full last page boundary)', async () => {
    // First page is full (2000) AND reaches the declared total exactly — the
    // `allRecipes.length >= total` guard must stop without a second request,
    // even though the page is full (which alone would not stop the loop).
    const fullPage = Array.from({ length: 2000 }, (_, i) => ({ id: `r${i}`, name: `d${i}` }))
    mockFetch({
      recipes: fullPage,
      total: 2000,
      pagination: { page: 1, limit: 2000, total: 2000, pages: 1 },
    })

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(2000)
    // Only one request should have been issued (no over-fetching past total).
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
  })

  it('treats missing/null recipes field as an empty page and stops', async () => {
    // `data.recipes ?? []` must coerce a missing or null field to [] so the
    // `length === 0` break fires instead of crashing on `.length`.
    mockFetchSequence([
      { body: { recipes: [{ id: 'r1' }], total: 1 } },
      { body: { recipes: null, total: 1 } },   // null -> []
      { body: { total: 1 } },                   // missing -> []
    ])

    const result = await fetchAllRecipes()
    expect(result).toHaveLength(1)
  })

  it('stress: accumulates 6 pages in order with no gaps or duplicates', async () => {
    // Multi-round pressure test: simulate a dataset larger than a single page
    // split across 6 responses (5 full pages + 1 partial). Verifies:
    //   - correct page sequencing (page=1..6 in the request URLs)
    //   - every item from every page is present exactly once, in order
    //   - the loop stops at the partial page (does not request page 7)
    const PAGE_SIZE = 2000
    const lastPageSize = 432

    const makePage = (page: number, size: number) => ({
      body: {
        recipes: Array.from({ length: size }, (_, i) => {
          const globalIndex = (page - 1) * PAGE_SIZE + i
          return { id: `r${globalIndex}`, name: `dish-${globalIndex}` }
        }),
        total: PAGE_SIZE * 5 + lastPageSize,
        pagination: { page, limit: PAGE_SIZE, total: PAGE_SIZE * 5 + lastPageSize, pages: 6 },
      },
    })

    const responses = [
      makePage(1, PAGE_SIZE),
      makePage(2, PAGE_SIZE),
      makePage(3, PAGE_SIZE),
      makePage(4, PAGE_SIZE),
      makePage(5, PAGE_SIZE),
      makePage(6, lastPageSize), // partial -> loop stops here
    ]
    mockFetchSequence(responses)

    const result = await fetchAllRecipes()

    // Page sequence is exactly 1..6, no 7th request past the partial page.
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
    expect(calls).toHaveLength(6)
    calls.forEach((c, i) => {
      expect(String(c[0])).toContain(`page=${i + 1}`)
    })

    // One-shot: order + exact membership across page boundaries. Strictly
    // stronger than separate length/min/max/dup checks (those are all implied).
    expect(result).toEqual(responses.flatMap(r => r.body.recipes))
  })
})

describe('fetchCategories', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns categories array', async () => {
    mockFetch({ categories: [{ id: 'meat', name: '荤菜', count: 10 }], total: 1 })

    const result = await fetchCategories()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('meat')
  })

  it('throws on non-ok response', async () => {
    mockFetch({ error: 'server error' }, { status: 500 })
    await expect(fetchCategories()).rejects.toThrow('API error: 500')
  })
})
