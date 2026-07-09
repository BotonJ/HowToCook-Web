import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

function mockFetchResponses() {
  globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
    const u = String(url)
    if (u.includes('en_index_curated.json')) {
      return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
    }
    if (u.includes('flavor-profiles.json')) {
      return new Response(JSON.stringify({}))
    }
    if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
    if (u.includes('/recipe/r1') && !u.includes('/recipes')) return new Response(JSON.stringify({ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', image_url: null, introduction: '经典红烧肉', steps: ['切肉', '炒糖色', '炖煮'], tips: ['选用五花肉'], optional_ingredients: [], tags: {} }))
    if (u.includes('/recipes')) return new Response(JSON.stringify({
      recipes: [{ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', tags: {} }],
      total: 1,
    }))
    return new Response('', { status: 404 })
  }) as unknown as typeof globalThis.fetch
}

async function freshModule() {
  vi.resetModules()
  return import('./useRecipes')
}

describe('useRecipes hook', () => {
  let mod: typeof import('./useRecipes')

  beforeEach(async () => {
    mockFetchResponses()
    mod = await freshModule()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads recipes and sets loading to false', async () => {
    const { result } = renderHook(() => mod.useRecipes())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipes.length).toBe(1)
    expect(result.current.categories.length).toBe(1)
    expect(result.current.categories[0].id).toBe('meat')
    expect(result.current.error).toBeNull()
  })

  it('shares module-level cache across hook instances', async () => {
    const { result: r1 } = renderHook(() => mod.useRecipes())
    await waitFor(() => expect(r1.current.loading).toBe(false))
    expect(r1.current.recipes[0].name).toBe('红烧肉')

    // Second instance should immediately have cached data (no loading)
    const { result: r2 } = renderHook(() => mod.useRecipes())
    expect(r2.current.loading).toBe(false)
    expect(r2.current.recipes.length).toBe(1)
  })

  it('retry clears cache and reloads', async () => {
    const { result } = renderHook(() => mod.useRecipes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipes.length).toBe(1)

    result.current.retry()
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipes.length).toBe(1)
    expect(result.current.categories[0].id).toBe('meat')
  })

  it('API is the primary source and returns correct data', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) {
        return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
      }
      if (u.includes('flavor-profiles.json')) {
        return new Response(JSON.stringify({}))
      }
      if (u.includes('/categories')) {
        return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      }
      if (u.includes('/recipes')) {
        return new Response(
          JSON.stringify({
            recipes: [
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
                tags: {},
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
                tags: {},
              },
            ],
            total: 2,
          }),
        )
      }
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    const { result } = renderHook(() => mod.useRecipes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipes.length).toBe(2)
    expect(result.current.recipes.map(r => r.name)).toContain('糖醋里脊')
    expect(result.current.recipes.map(r => r.name)).toContain('红烧肉')
  })
})

describe('findRecipeById', () => {
  let mod: typeof import('./useRecipes')

  beforeEach(async () => {
    mockFetchResponses()
    mod = await freshModule()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('finds recipe by id', async () => {
    const recipe = await mod.findRecipeById('r1')
    expect(recipe).not.toBeNull()
    expect(recipe?.name).toBe('红烧肉')
    expect(recipe?.category).toBe('meat')
  })

  it('returns null for unknown id', async () => {
    const recipe = await mod.findRecipeById('unknown')
    expect(recipe).toBeNull()
  })
})

describe('useRecipes with English/noodle/flavor data', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('merges English categories into Chinese categories', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) {
        return new Response(JSON.stringify({
          version: '1', total: 1, source: 'en',
          dishes: [{ name: 'Kung Pao Chicken', difficulty: 3, category: 'meat', source: 'epicurious', cuisine: 'Sichuan', cooking_method: 'stir-fry', cook_time: '30min', main_ingredients: ['chicken'], ingredients: ['chicken', 'peanuts'], language: 'en' }],
        }))
      }
      if (u.includes('flavor-profiles.json')) return new Response(JSON.stringify({}))
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      if (u.includes('/recipes')) return new Response(JSON.stringify({ recipes: [{ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', tags: {} }], total: 1 }))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Should have both Chinese and English recipes merged
    const allRecipes = result.current.recipes
    expect(allRecipes.some(r => r.name === '红烧肉')).toBe(true)
    expect(allRecipes.some(r => r.name === 'Kung Pao Chicken')).toBe(true)
  })

  it('shows noodle recipes from API in correct category', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
      if (u.includes('flavor-profiles.json')) return new Response(JSON.stringify({}))
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'staple', name: '主食' }], total: 1 }))
      if (u.includes('/recipes')) return new Response(JSON.stringify({ recipes: [
        { id: 'r1', name: '米饭', category: 'staple', difficulty: 1, cuisine: 'Chinese', cooking_method: 'steam', cook_time: '30min', ingredients: ['rice'], main_ingredients: ['rice'], source: 'howtocook', tags: {} },
        { id: 'n1', name: '兰州拉面', category: 'staple', difficulty: 4, cuisine: 'Lanzhou', cooking_method: 'boil', cook_time: '120min', ingredients: ['flour', 'beef'], main_ingredients: ['flour'], source: 'howtocook', tags: {} },
      ], total: 2 }))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    const stapleCat = result.current.categories.find(c => c.id === 'staple')
    expect(stapleCat).toBeDefined()
    expect(stapleCat!.recipes.some(r => r.name === '米饭')).toBe(true)
    expect(stapleCat!.recipes.some(r => r.name === '兰州拉面')).toBe(true)
  })

  it('merges flavor profiles into recipes', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
      if (u.includes('flavor-profiles.json')) {
        return new Response(JSON.stringify({ r1: { sweet: 3, sour: 1, bitter: 0, umami: 8, spicy: 2, fat: 7, salty: 6, aromatic: 5 } }))
      }
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      if (u.includes('/recipes')) return new Response(JSON.stringify({ recipes: [{ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', tags: {} }], total: 1 }))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    const recipe = result.current.recipes.find(r => r.id === 'r1')
    expect(recipe).toBeDefined()
    expect(recipe!.flavorProfile).toEqual({ sweet: 3, sour: 1, bitter: 0, umami: 8, spicy: 2, fat: 7, salty: 6, aromatic: 5 })
  })

  it('handles English index fetch failure gracefully', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) return new Response('', { status: 500 })
      if (u.includes('flavor-profiles.json')) return new Response(JSON.stringify({}))
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      if (u.includes('/recipes')) return new Response(JSON.stringify({ recipes: [{ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', tags: {} }], total: 1 }))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Should still load Chinese recipes
    expect(result.current.recipes.some(r => r.name === '红烧肉')).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles flavor profiles fetch failure gracefully', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('en_index_curated.json')) return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
      if (u.includes('flavor-profiles.json')) return new Response('', { status: 500 })
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      if (u.includes('/recipes')) return new Response(JSON.stringify({ recipes: [{ id: 'r1', name: '红烧肉', category: 'meat', difficulty: 3, cuisine: 'Hunan', cooking_method: 'braise', cook_time: '60min', ingredients: ['pork'], main_ingredients: ['pork'], source: 'howtocook', tags: {} }], total: 1 }))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipes.some(r => r.name === '红烧肉')).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('shows error when main index fetch fails', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('/recipes')) return new Response('', { status: 500 })
      if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
      if (u.includes('en_index_curated.json')) return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
      if (u.includes('flavor-profiles.json')) return new Response(JSON.stringify({}))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    vi.resetModules()
    const mod = await import('./useRecipes')
    const { result } = renderHook(() => mod.useRecipes())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.error).toContain('500')
  })
})
