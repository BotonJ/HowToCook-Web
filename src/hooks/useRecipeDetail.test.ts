import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecipeDetail } from './useRecipeDetail'
import type { Recipe } from '@/types'
import type { ApiRecipeDetail } from '@/types/api'

type Props = { id: string; fallback: Recipe | null }

const localRecipe: Recipe = {
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
}

const localRecipeWithFlavor: Recipe = {
  ...localRecipe,
  flavorProfile: { sweet: 3, sour: 1, bitter: 0, umami: 8, spicy: 2, fat: 7, salty: 6, aromatic: 5 },
}

const apiDetail: ApiRecipeDetail = {
  id: 'r1',
  name: '红烧肉',
  category: 'meat',
  image_url: 'https://img.howtocook.cn/r1.jpeg',
  introduction: '经典湖南菜',
  difficulty: 3,
  cuisine: 'Hunan',
  cooking_method: 'braise',
  cook_time: '60min',
  ingredients: ['pork', 'soy sauce'],
  optional_ingredients: ['star anise'],
  main_ingredients: ['pork'],
  steps: ['切肉', '炒糖色', '炖煮'],
  tips: ['小火慢炖'],
  tags: { spicy: false },
  source: 'howtocook',
}

vi.mock('@/services/api', () => ({
  getRecipeDetail: vi.fn(),
}))

vi.mock('@/lib/api-transform', () => ({
  transformApiRecipe: vi.fn((r: ApiRecipeDetail) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    cooking_method: r.cooking_method,
    cook_time: r.cook_time,
    ingredients: r.ingredients,
    main_ingredients: r.main_ingredients,
    source: r.source,
  })),
}))

import { getRecipeDetail } from '@/services/api'

const mockGetRecipeDetail = vi.mocked(getRecipeDetail)

describe('useRecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows local fallback immediately without loading', () => {
    mockGetRecipeDetail.mockResolvedValue(apiDetail)
    const { result } = renderHook(() => useRecipeDetail('r1', localRecipe))

    // Local fallback should be shown immediately
    expect(result.current.recipe?.name).toBe('红烧肉')
    expect(result.current.loading).toBe(false)
    expect(result.current.fromApi).toBe(false)
  })

  it('replaces with API data after fetch', async () => {
    mockGetRecipeDetail.mockResolvedValue(apiDetail)
    const { result } = renderHook(() => useRecipeDetail('r1', localRecipe))

    await waitFor(() => expect(result.current.fromApi).toBe(true))
    expect(result.current.recipe?.name).toBe('红烧肉')
    expect(result.current.recipe?.ingredients).toEqual(['pork', 'soy sauce'])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('shows loading when no local fallback', async () => {
    mockGetRecipeDetail.mockResolvedValue(apiDetail)
    const { result } = renderHook(() => useRecipeDetail('r1', null))

    expect(result.current.loading).toBe(true)
    expect(result.current.recipe).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.recipe?.name).toBe('红烧肉')
    expect(result.current.fromApi).toBe(true)
  })

  it('keeps fallback on API error', async () => {
    mockGetRecipeDetail.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useRecipeDetail('r1', localRecipe))

    // Local fallback stays visible
    expect(result.current.recipe?.name).toBe('红烧肉')

    await waitFor(() => expect(result.current.error).toBe('Network error'))
    // Fallback is still shown
    expect(result.current.recipe?.name).toBe('红烧肉')
    expect(result.current.fromApi).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('sets error when no fallback and API fails', async () => {
    mockGetRecipeDetail.mockRejectedValue(new Error('Not found'))
    const { result } = renderHook(() => useRecipeDetail('r1', null))

    await waitFor(() => expect(result.current.error).toBe('Not found'))
    expect(result.current.recipe).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('clears recipe when recipeId is undefined', () => {
    mockGetRecipeDetail.mockResolvedValue(apiDetail)
    const { result } = renderHook(() => useRecipeDetail(undefined, localRecipe))

    expect(result.current.recipe).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(mockGetRecipeDetail).not.toHaveBeenCalled()
  })

  it('uses non-Error message fallback', async () => {
    mockGetRecipeDetail.mockRejectedValue('string error')
    const { result } = renderHook(() => useRecipeDetail('r1', null))

    await waitFor(() => expect(result.current.error).toBe('Failed to load recipe'))
  })

  it('refetches when recipeId changes', async () => {
    mockGetRecipeDetail.mockResolvedValueOnce(apiDetail)
    const { result, rerender } = renderHook(
      ({ id, fallback }: Props) => useRecipeDetail(id, fallback),
      { initialProps: { id: 'r1', fallback: localRecipe } } as { initialProps: Props },
    )

    await waitFor(() => expect(result.current.fromApi).toBe(true))

    const apiDetail2: ApiRecipeDetail = { ...apiDetail, id: 'r2', name: '糖醋里脊' }
    mockGetRecipeDetail.mockResolvedValueOnce(apiDetail2)

    rerender({ id: 'r2', fallback: null } as Props)

    await waitFor(() => expect(result.current.fromApi).toBe(true))
    expect(mockGetRecipeDetail).toHaveBeenCalledWith('r2')
  })

  it('preserves flavorProfile from local fallback after API data loads', async () => {
    // Regression: API detail does not carry flavorProfile. Without preserving
    // it from the fallback, the radar chart would disappear once the API responds.
    mockGetRecipeDetail.mockResolvedValue(apiDetail)
    const { result } = renderHook(() => useRecipeDetail('r1', localRecipeWithFlavor))

    await waitFor(() => expect(result.current.fromApi).toBe(true))
    // API enriched ingredients, AND flavor from fallback survived
    expect(result.current.recipe?.ingredients).toEqual(['pork', 'soy sauce'])
    expect(result.current.recipe?.flavorProfile).toEqual(localRecipeWithFlavor.flavorProfile)
  })
})
