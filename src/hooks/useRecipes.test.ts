import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

function mockFetchResponses() {
  globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
    const u = String(url)
    if (u.includes('recipes-meta.json')) {
      return new Response(
        JSON.stringify([
          {
            id: 'meat',
            name: '荤菜',
            displayName: '荤菜',
            count: 1,
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
              },
            ],
          },
        ]),
      )
    }
    if (u.includes('en_index_curated.json')) {
      return new Response(JSON.stringify({ version: '1', total: 0, source: 'en', dishes: [] }))
    }
    if (u.includes('noodle-recipes.json')) {
      return new Response(JSON.stringify({ version: '1', total: 0, source: 'noodle', dishes: [] }))
    }
    if (u.includes('flavor-profiles.json')) {
      return new Response(JSON.stringify({}))
    }
    if (u.includes('recipes-detail.json')) {
      return new Response(
        JSON.stringify([
          {
            id: 'meat',
            name: '荤菜',
            displayName: '荤菜',
            count: 1,
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
              },
            ],
          },
        ]),
      )
    }
    if (u.includes('/categories')) return new Response(JSON.stringify({ categories: [{ id: 'meat', name: '荤菜' }], total: 1 }))
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

  it('finds recipe by id using index cache', async () => {
    const recipe = await mod.findRecipeById('r1')
    expect(recipe).not.toBeNull()
    expect(recipe?.name).toBe('红烧肉')
    expect(recipe?.category).toBe('meat')
  })

  it('returns null for unknown id', async () => {
    const recipe = await mod.findRecipeById('unknown')
    expect(recipe).toBeNull()
  })

  it('uses recipeIndexCache on second lookup', async () => {
    await mod.findRecipeById('r1')
    // Second call should use cached index (no additional fetches for detail)
    const recipe = await mod.findRecipeById('r1')
    expect(recipe?.name).toBe('红烧肉')
  })
})

describe('getFullRecipeData cache', () => {
  let mod: typeof import('./useRecipes')

  beforeEach(async () => {
    mockFetchResponses()
    mod = await freshModule()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('caches full recipe data and returns same reference', async () => {
    const data1 = await mod.getFullRecipeData()
    const data2 = await mod.getFullRecipeData()
    expect(data1).toBe(data2) // identical reference = cached
    expect(data1.length).toBe(1)
    expect(data1[0].recipes[0].id).toBe('r1')
  })
})
