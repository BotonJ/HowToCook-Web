import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSearch } from './useSearch'
import type { Recipe } from '@/types'

const localRecipes: Recipe[] = [
  {
    id: 'r1',
    name: '红烧肉',
    category: 'meat',
    difficulty: 3,
    cuisine: 'Hunan',
    cooking_method: 'braise',
    cook_time: '60min',
    ingredients: ['pork'],
    main_ingredients: ['pork'],
    source: 'howtocook',
  },
  {
    id: 'r2',
    name: '糖醋里脊',
    category: 'meat',
    difficulty: 3,
    cuisine: 'Shandong',
    cooking_method: 'fry',
    cook_time: '45min',
    ingredients: ['pork'],
    main_ingredients: ['pork'],
    source: 'howtocook',
  },
]

function mockSearchFetch(results: { id: string; name: string }[] = []) {
  globalThis.fetch = vi.fn(async () => {
    return new Response(
      JSON.stringify({
        results: results.map(r => ({
          id: r.id,
          name: r.name,
          category: 'meat',
          difficulty: 3,
          cuisine: 'Hunan',
          cooking_method: 'braise',
          image_url: null,
          cook_time: '60min',
          ingredients: ['pork'],
          main_ingredients: ['pork'],
          source: 'howtocook',
        })),
        total: results.length,
        query: { q: 'test', category: '', cuisine: '', cooking_method: '', cook_time: '', limit: 20 },
      }),
    )
  }) as unknown as typeof globalThis.fetch
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null results for empty query', () => {
    mockSearchFetch([])
    const { result } = renderHook(() => useSearch('', localRecipes))
    expect(result.current.results).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('debounces search and returns API results', async () => {
    mockSearchFetch([{ id: 'r1', name: '红烧肉' }])

    const { result } = renderHook(() => useSearch('肉', localRecipes, 50))

    // Should not have called API yet (debouncing)
    expect(globalThis.fetch).not.toHaveBeenCalled()

    // Wait for debounce + API + state update
    await waitFor(() => expect(result.current.results).not.toBeNull(), { timeout: 3000 })
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results![0].name).toBe('红烧肉')
    expect(result.current.loading).toBe(false)
  })

  it('shows error on API failure', async () => {
    globalThis.fetch = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof globalThis.fetch

    const { result } = renderHook(() => useSearch('肉', localRecipes, 50))

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 3000 })
    expect(result.current.error).toBe('API error: 500')
    expect(result.current.results).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('filters results by source', async () => {
    mockSearchFetch([
      { id: 'r1', name: '红烧肉' },
      { id: 'external1', name: 'External Dish' },
    ])

    const { result } = renderHook(() => useSearch('肉', localRecipes, 50))

    await waitFor(() => expect(result.current.results).not.toBeNull(), { timeout: 3000 })
    // Only howtocook source recipes should pass through
    expect(result.current.results!.every(r => r.source === 'howtocook')).toBe(true)
  })

  it('clears results when query becomes empty', async () => {
    mockSearchFetch([{ id: 'r1', name: '红烧肉' }])

    const { result, rerender } = renderHook(
      ({ q }) => useSearch(q, localRecipes, 50),
      { initialProps: { q: '肉' } },
    )

    await waitFor(() => expect(result.current.results).not.toBeNull(), { timeout: 3000 })
    expect(result.current.results).toHaveLength(1)

    // Clear query
    rerender({ q: '' })

    expect(result.current.results).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('uses non-Error message fallback on API error', async () => {
    globalThis.fetch = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof globalThis.fetch

    const { result } = renderHook(() => useSearch('肉', localRecipes, 50))

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 3000 })
    expect(result.current.error).toBe('API error: 500')
  })

  it('rate limits and falls back to local search', async () => {
    vi.useFakeTimers()

    let now = 1000
    vi.setSystemTime(now)

    let fetchCount = 0
    globalThis.fetch = vi.fn(async () => {
      fetchCount++
      return new Response(
        JSON.stringify({
          results: [],
          total: 0,
          query: { q: 'test', category: '', cuisine: '', cooking_method: '', cook_time: '', limit: 20 },
        }),
      )
    }) as unknown as typeof globalThis.fetch

    const { result, rerender } = renderHook(
      ({ q }) => useSearch(q, localRecipes, 0),
      { initialProps: { q: 'search1' } },
    )

    // Fire 10 searches — each should hit the API
    for (let i = 2; i <= 11; i++) {
      // Advance timers to fire the debounced setTimeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10)
      })
      // Advance system time so timestamps stay within 30s window
      now += 100
      vi.setSystemTime(now)
      rerender({ q: `search${i}` })
    }

    // Final advance for the last search
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(fetchCount).toBe(10)

    // Now search for something that matches local data — should use local fallback
    const fetchCountBefore = fetchCount
    now += 100
    vi.setSystemTime(now)
    rerender({ q: '红烧' })

    // Advance timers for the rate-limited search (no API call)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })

    // Should NOT have made another API call (rate limited)
    expect(fetchCount).toBe(fetchCountBefore)
    // Should have local results matching "红烧"
    expect(result.current.results).toBeDefined()
    expect(result.current.results!.some(r => r.name.includes('红烧'))).toBe(true)
    expect(result.current.loading).toBe(false)

    vi.useRealTimers()
  })
})
