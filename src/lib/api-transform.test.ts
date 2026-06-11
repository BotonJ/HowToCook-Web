import { describe, it, expect } from 'vitest'
import { transformDishIndex, transformApiRecipe, transformSearchResult } from './api-transform'
import type { DishIndex, ApiRecipeDetail, ApiSearchResult } from '@/types/api'
import type { Recipe } from '@/types'

const minimalDish: DishIndex = {
  id: 'test/1',
  name: 'Test Dish',
  difficulty: 3,
  category: 'meat',
  source: 'howtocook',
  cuisine: 'Sichuan',
  cooking_method: 'stir-fry',
  cook_time: '30min',
  main_ingredients: ['beef'],
  ingredients: ['beef', 'soy_sauce'],
  tags: { spicy: true },
  language: 'zh',
}

describe('transformDishIndex', () => {
  it('transforms minimal dish index correctly', () => {
    const result = transformDishIndex(minimalDish)
    expect(result.id).toBe('test/1')
    expect(result.name).toBe('Test Dish')
    expect(result.category).toBe('meat')
    expect(result.difficulty).toBe(3)
    expect(result.cuisine).toBe('Sichuan')
    expect(result.cooking_method).toBe('stir-fry')
    expect(result.cook_time).toBe('30min')
    expect(result.ingredients).toEqual(['beef', 'soy_sauce'])
    expect(result.main_ingredients).toEqual(['beef'])
    expect(result.tags).toEqual({ spicy: true })
    expect(result.source).toBe('howtocook')
    expect(result.language).toBe('zh')
    // Optional fields should be absent
    expect(result.imagePath).toBeUndefined()
    expect(result.description).toBeUndefined()
  })

  it('preserves empty arrays', () => {
    const dish: DishIndex = { ...minimalDish, ingredients: [], main_ingredients: [] }
    const result = transformDishIndex(dish)
    expect(result.ingredients).toEqual([])
    expect(result.main_ingredients).toEqual([])
  })

  it('handles missing optional fields', () => {
    const dish = { ...minimalDish, tags: undefined, language: undefined } as unknown as DishIndex
    const result = transformDishIndex(dish)
    expect(result.tags).toBeUndefined()
    expect(result.language).toBeUndefined()
  })
})

describe('transformApiRecipe', () => {
  const baseApi: ApiRecipeDetail = {
    id: 'r1',
    name: 'Dish',
    category: 'veg',
    image_url: '/img.jpg',
    introduction: 'Intro text',
    difficulty: 2,
    cuisine: 'Hunan',
    cooking_method: 'steam',
    cook_time: '20min',
    ingredients: ['tofu'],
    optional_ingredients: ['scallion'],
    main_ingredients: ['tofu'],
    steps: ['cut tofu', 'steam for 20min'],
    tips: ['tip1', 'tip2'],
    tags: {},
    source: 'howtocook',
  }

  it('transforms full API recipe with all fields', () => {
    const result = transformApiRecipe(baseApi)
    expect(result.id).toBe('r1')
    expect(result.name).toBe('Dish')
    expect(result.category).toBe('veg')
    expect(result.imagePath).toBe('/img.jpg')
    expect(result.difficulty).toBe(2)
    expect(result.cuisine).toBe('Hunan')
    expect(result.cooking_method).toBe('steam')
    expect(result.cook_time).toBe('20min')
    expect(result.ingredients).toEqual(['tofu'])
    expect(result.main_ingredients).toEqual(['tofu'])
    expect(result.description).toBe('Intro text')
    expect(result.ingredients_text).toBe('tofu\nOptional: scallion')
    expect(result.steps_text).toBe('1. cut tofu\n2. steam for 20min')
    expect(result.extra_text).toBe('tip1\ntip2')
    expect(result.source).toBe('howtocook')
  })

  it('handles absolute image URL', () => {
    const api: ApiRecipeDetail = { ...baseApi, image_url: 'https://example.com/img.jpg' }
    const result = transformApiRecipe(api)
    expect(result.imagePath).toBe('https://example.com/img.jpg')
  })

  it('returns undefined for empty optional arrays', () => {
    const api: ApiRecipeDetail = {
      ...baseApi,
      image_url: null,
      introduction: null,
      optional_ingredients: [],
      steps: [],
      tips: [],
    }
    const result = transformApiRecipe(api)
    expect(result.imagePath).toBeUndefined()
    expect(result.description).toBeUndefined()
    expect(result.ingredients_text).toBe('tofu')
    expect(result.steps_text).toBeUndefined()
    expect(result.extra_text).toBeUndefined()
  })

  it('builds ingredients_text without optional when empty', () => {
    const api: ApiRecipeDetail = { ...baseApi, optional_ingredients: [] }
    const result = transformApiRecipe(api)
    expect(result.ingredients_text).toBe('tofu')
  })

  it('builds steps_text from single step', () => {
    const api: ApiRecipeDetail = { ...baseApi, steps: ['only step'] }
    const result = transformApiRecipe(api)
    expect(result.steps_text).toBe('1. only step')
  })

  it('handles null image_url', () => {
    const api: ApiRecipeDetail = { ...baseApi, image_url: null }
    const result = transformApiRecipe(api)
    expect(result.imagePath).toBeUndefined()
  })
})

describe('transformSearchResult', () => {
  it('returns local recipe when found in map', () => {
    const local: Recipe = {
      id: 'r1',
      name: 'Local',
      category: 'meat',
      difficulty: 1,
      cuisine: '',
      cooking_method: '',
      cook_time: '',
      ingredients: [],
      main_ingredients: [],
      source: 'howtocook',
    }
    const map = new Map([['r1', local]])
    const api: ApiSearchResult = {
      id: 'r1',
      name: 'Remote',
      category: 'veg',
      difficulty: 2,
      cuisine: 'Hunan',
      cooking_method: 'fry',
      image_url: null,
    }
    const result = transformSearchResult(api, map)
    expect(result).toBe(local)
  })

  it('falls back to remote result when not in local map', () => {
    const map = new Map<string, Recipe>()
    const api: ApiSearchResult = {
      id: 'r2',
      name: 'Remote',
      category: 'veg',
      difficulty: 2,
      cuisine: 'Hunan',
      cooking_method: 'fry',
      image_url: '/pic.jpg',
    }
    const result = transformSearchResult(api, map)
    expect(result.id).toBe('r2')
    expect(result.name).toBe('Remote')
    expect(result.category).toBe('veg')
    expect(result.difficulty).toBe(2)
    expect(result.cuisine).toBe('Hunan')
    expect(result.cooking_method).toBe('fry')
    expect(result.imagePath).toBe('/pic.jpg')
    expect(result.source).toBe('howtocook')
    expect(result.ingredients).toEqual([])
    expect(result.main_ingredients).toEqual([])
    expect(result.cook_time).toBe('')
  })

  it('falls back with absolute image URL', () => {
    const map = new Map<string, Recipe>()
    const api: ApiSearchResult = {
      id: 'r3',
      name: 'Remote',
      category: 'veg',
      difficulty: 1,
      cuisine: '',
      cooking_method: '',
      image_url: 'https://cdn.example.com/img.png',
    }
    const result = transformSearchResult(api, map)
    expect(result.imagePath).toBe('https://cdn.example.com/img.png')
  })

  it('falls back with null image_url', () => {
    const map = new Map<string, Recipe>()
    const api: ApiSearchResult = {
      id: 'r4',
      name: 'Remote',
      category: 'veg',
      difficulty: 1,
      cuisine: '',
      cooking_method: '',
      image_url: null,
    }
    const result = transformSearchResult(api, map)
    expect(result.imagePath).toBeUndefined()
  })
})
