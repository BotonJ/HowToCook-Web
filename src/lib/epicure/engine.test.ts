import { describe, it, expect, vi, beforeEach } from 'vitest'

function createEmbeddingsBuffer(): ArrayBuffer {
  const arr = new Float32Array(600) // 2 ingredients * 300 dims
  // beef = [1, 0, 0, ...]
  arr[0] = 1
  // carrot = [0, 1, 0, ...]
  arr[301] = 1
  return arr.buffer
}

const TEST_META = {
  version: 'test',
  n_ingredients: 2,
  n_dims: 300,
  vocab: { beef: 0, carrot: 1 },
  itos: ['beef', 'carrot'],
  cuisinePoles: {
    East_Asian: Array.from({ length: 300 }, (_, i) => (i === 1 ? 1 : 0)),
  },
  modes: [
    {
      id: 'sweet',
      kind: 'taste',
      property: 'sweet',
      label: 'Sweet',
      n_members: 1,
      members: ['beef'],
    },
  ],
}

async function freshEngine() {
  vi.resetModules()
  return import('./engine')
}

async function mockFetchAndLoad(
  engine: typeof import('./engine'),
  overrides?: { vocabZh?: Record<string, string>; modeLabelsZh?: Record<string, string> },
) {
  globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
    const u = String(url)
    if (u.includes('embeddings.f32')) return new Response(createEmbeddingsBuffer())
    if (u.includes('metadata.json')) return new Response(JSON.stringify(TEST_META))
    if (u.includes('epicure_vocab_zh.json'))
      return new Response(JSON.stringify(overrides?.vocabZh ?? { beef: '牛肉', carrot: '胡萝卜' }))
    if (u.includes('mode-labels-zh.json'))
      return new Response(JSON.stringify(overrides?.modeLabelsZh ?? { Sweet: '甜' }))
    return new Response('', { status: 404 })
  }) as unknown as typeof globalThis.fetch
  await engine.loadData()
}

describe('engine pure functions — unloaded state', () => {
  let engine: typeof import('./engine')

  beforeEach(async () => {
    engine = await freshEngine()
  })

  it('cosineSimilarity returns 1 for identical vectors', () => {
    const a = new Float32Array([1, 2, 3])
    expect(engine.cosineSimilarity(a, a)).toBeCloseTo(1, 6)
  })

  it('cosineSimilarity returns 0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0, 0])
    const b = new Float32Array([0, 1, 0])
    expect(engine.cosineSimilarity(a, b)).toBeCloseTo(0, 6)
  })

  it('cosineSimilarity returns -1 for opposite vectors', () => {
    const a = new Float32Array([1, 0, 0])
    const b = new Float32Array([-1, 0, 0])
    expect(engine.cosineSimilarity(a, b)).toBeCloseTo(-1, 6)
  })

  it('cosineSimilarity returns 0 for zero vector', () => {
    const a = new Float32Array([0, 0, 0])
    const b = new Float32Array([1, 2, 3])
    expect(engine.cosineSimilarity(a, b)).toBe(0)
  })

  it('formatName replaces underscores with spaces', () => {
    expect(engine.formatName('soy_sauce')).toBe('soy sauce')
  })

  it('formatName leaves no-underscore names intact', () => {
    expect(engine.formatName('salt')).toBe('salt')
  })

  it('isLoaded returns false before loadData', () => {
    expect(engine.isLoaded()).toBe(false)
  })

  it('getVocabSize returns 0 before load', () => {
    expect(engine.getVocabSize()).toBe(0)
  })

  it('getNearestNeighbors returns empty array', () => {
    expect(engine.getNearestNeighbors('beef', 5)).toEqual([])
  })

  it('getZhMap returns empty object', () => {
    expect(engine.getZhMap()).toEqual({})
  })

  it('getModeLabelZh returns empty string', () => {
    expect(engine.getModeLabelZh('Sweet')).toBe('')
  })

  it('getModeLabelsZh returns empty object', () => {
    expect(engine.getModeLabelsZh()).toEqual({})
  })

  it('getEnName returns empty string', () => {
    expect(engine.getEnName('牛肉')).toBe('')
  })

  it('getIngredientIndex returns undefined', () => {
    expect(engine.getIngredientIndex('beef')).toBeUndefined()
  })

  it('getIngredientName returns undefined', () => {
    expect(engine.getIngredientName(0)).toBeUndefined()
  })

  it('getEmbedding returns null', () => {
    expect(engine.getEmbedding(0)).toBeNull()
  })
})

describe('engine pure functions — with loaded data', () => {
  let engine: typeof import('./engine')

  beforeEach(async () => {
    engine = await freshEngine()
    await mockFetchAndLoad(engine)
  })

  it('isLoaded returns true after loadData', () => {
    expect(engine.isLoaded()).toBe(true)
  })

  it('getVocabSize returns correct count', () => {
    expect(engine.getVocabSize()).toBe(2)
  })

  it('getIngredientIndex returns correct index', () => {
    expect(engine.getIngredientIndex('beef')).toBe(0)
    expect(engine.getIngredientIndex('carrot')).toBe(1)
    expect(engine.getIngredientIndex('unknown')).toBeUndefined()
  })

  it('getIngredientName returns correct name', () => {
    expect(engine.getIngredientName(0)).toBe('beef')
    expect(engine.getIngredientName(1)).toBe('carrot')
    expect(engine.getIngredientName(99)).toBeUndefined()
  })

  it('getEmbedding returns slice for valid index', () => {
    const emb = engine.getEmbedding(0)
    expect(emb).not.toBeNull()
    expect(emb!.length).toBe(300)
    expect(emb![0]).toBe(1)
  })

  it('getEmbedding returns empty Float32Array for out-of-bounds index', () => {
    const emb = engine.getEmbedding(99)
    expect(emb).not.toBeNull()
    expect(emb!.length).toBe(0)
  })

  it('getNearestNeighbors returns sorted neighbors', () => {
    const neighbors = engine.getNearestNeighbors('beef', 1)
    expect(neighbors.length).toBe(1)
    expect(neighbors[0].name).toBe('carrot')
    expect(neighbors[0].nameZh).toBe('胡萝卜')
    // cosine([1,0,...], [0,1,...]) = 0
    expect(neighbors[0].score).toBeCloseTo(0, 6)
  })

  it('slerp rotates towards direction', () => {
    const results = engine.slerp('beef', 'carrot', 45, 1)
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('carrot')
  })

  it('slerp returns empty for unknown seed', () => {
    expect(engine.slerp('unknown', 'carrot', 45, 1)).toEqual([])
  })

  it('slerp returns empty for unknown direction', () => {
    expect(engine.slerp('beef', 'unknown', 45, 1)).toEqual([])
  })

  it('getClosestMode calculates average similarity', () => {
    const modes = engine.getClosestMode('beef', 5)
    expect(modes.length).toBe(1)
    expect(modes[0].label).toBe('Sweet')
    expect(modes[0].score).toBeCloseTo(1, 6) // beef vs beef = 1
    expect(modes[0].members).toEqual(['beef'])
  })

  it('getClosestMode returns empty for unknown ingredient', () => {
    expect(engine.getClosestMode('unknown', 5)).toEqual([])
  })

  it('searchVocabulary finds by English prefix', () => {
    const matches = engine.searchVocabulary('car', 5)
    expect(matches).toContain('carrot')
  })

  it('searchVocabulary finds by Chinese name', () => {
    const matches = engine.searchVocabulary('牛肉', 5)
    expect(matches).toContain('beef')
  })

  it('searchVocabulary respects limit', () => {
    const matches = engine.searchVocabulary('b', 5)
    expect(matches.length).toBeLessThanOrEqual(5)
  })

  it('getCuisinePoles returns mapped labels', () => {
    const poles = engine.getCuisinePoles()
    expect(poles).toEqual([{ key: 'East_Asian', label: '东亚' }])
  })

  it('slerpToCuisine uses cuisine pole', () => {
    const results = engine.slerpToCuisine('beef', 'East_Asian', 30, 1)
    expect(results.length).toBe(1)
  })

  it('slerpToCuisine returns empty for unknown seed', () => {
    expect(engine.slerpToCuisine('unknown', 'East_Asian', 30, 1)).toEqual([])
  })

  it('slerpToCuisine returns empty for unknown cuisine', () => {
    expect(engine.slerpToCuisine('beef', 'Unknown', 30, 1)).toEqual([])
  })

  it('getZhMap returns translations', () => {
    expect(engine.getZhMap()).toEqual({ beef: '牛肉', carrot: '胡萝卜' })
  })

  it('getModeLabelZh returns translation', () => {
    expect(engine.getModeLabelZh('Sweet')).toBe('甜')
  })

  it('getEnName returns English name from Chinese', () => {
    expect(engine.getEnName('牛肉')).toBe('beef')
    expect(engine.getEnName('未知')).toBe('')
  })

  it('computeRecipeEmbeddings averages ingredient vectors', () => {
    const recipes = [{ id: 'r1', ingredients: ['beef', 'carrot'] }]
    const embeddings = engine.computeRecipeEmbeddings(recipes)
    expect(embeddings.length).toBe(1)
    expect(embeddings[0].id).toBe('r1')
    // avg of [1,0,...] and [0,1,...] = [0.5, 0.5, 0, ...]
    expect(embeddings[0].embedding[0]).toBeCloseTo(0.5, 6)
    expect(embeddings[0].embedding[1]).toBeCloseTo(0.5, 6)
  })

  it('computeRecipeEmbeddings falls back with zhReverse', () => {
    const recipes = [{ id: 'r1', ingredients: ['牛肉'] }] // Chinese name
    const embeddings = engine.computeRecipeEmbeddings(recipes)
    expect(embeddings.length).toBe(1)
    expect(embeddings[0].embedding[0]).toBeCloseTo(1, 6)
  })

  it('computeRecipeEmbeddings skips recipes with no matching ingredients', () => {
    const recipes = [{ id: 'r1', ingredients: ['unknown_ingredient'] }]
    const embeddings = engine.computeRecipeEmbeddings(recipes)
    expect(embeddings.length).toBe(0)
  })

  it('computeRecipeEmbeddings handles empty recipe list', () => {
    expect(engine.computeRecipeEmbeddings([])).toEqual([])
  })
})

describe('engine cooccurrence & international recipes', () => {
  let engine: typeof import('./engine')

  beforeEach(async () => {
    engine = await freshEngine()
    await mockFetchAndLoad(engine)
  })

  it('loadCooccurrenceData fetches and parses adjacency', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('ingredient-cooccurrence.json')) {
        return new Response(
          JSON.stringify({
            adjacency: {
              牛肉: [{ ingredient: '土豆', pmi: 1.5, count: 10 }],
            },
          }),
        )
      }
      // fallback for loadData
      if (u.includes('embeddings.f32')) return new Response(createEmbeddingsBuffer())
      if (u.includes('metadata.json')) return new Response(JSON.stringify(TEST_META))
      if (u.includes('epicure_vocab_zh.json')) return new Response(JSON.stringify({ beef: '牛肉' }))
      if (u.includes('mode-labels-zh.json')) return new Response(JSON.stringify({}))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    await engine.loadCooccurrenceData()
    const pairs = engine.getCooccurrencePairs('beef', '牛肉', 5)
    expect(pairs.length).toBe(1)
    expect(pairs[0].ingredient).toBe('土豆')
    expect(pairs[0].pmi).toBe(1.5)
  })

  it('getCooccurrencePairs falls back to English name', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('ingredient-cooccurrence.json')) {
        return new Response(
          JSON.stringify({
            adjacency: {
              beef: [{ ingredient: 'potato', pmi: 1.2, count: 8 }],
            },
          }),
        )
      }
      if (u.includes('embeddings.f32')) return new Response(createEmbeddingsBuffer())
      if (u.includes('metadata.json')) return new Response(JSON.stringify(TEST_META))
      if (u.includes('epicure_vocab_zh.json')) return new Response(JSON.stringify({}))
      if (u.includes('mode-labels-zh.json')) return new Response(JSON.stringify({}))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    await engine.loadCooccurrenceData()
    const pairs = engine.getCooccurrencePairs('beef', '', 5)
    expect(pairs.length).toBe(1)
    expect(pairs[0].ingredient).toBe('potato')
  })

  it('getCooccurrencePairs returns empty when no data loaded', () => {
    expect(engine.getCooccurrencePairs('beef', '牛肉', 5)).toEqual([])
  })

  it('loadInternationalRecipes fetches and parses recipes', async () => {
    globalThis.fetch = vi.fn(async (url: string | Request | URL) => {
      const u = String(url)
      if (u.includes('ingredient-recipes-flat.json')) {
        return new Response(
          JSON.stringify({
            beef: ['recipenlg/italian/beef stew'],
          }),
        )
      }
      if (u.includes('embeddings.f32')) return new Response(createEmbeddingsBuffer())
      if (u.includes('metadata.json')) return new Response(JSON.stringify(TEST_META))
      if (u.includes('epicure_vocab_zh.json')) return new Response(JSON.stringify({}))
      if (u.includes('mode-labels-zh.json')) return new Response(JSON.stringify({}))
      return new Response('', { status: 404 })
    }) as unknown as typeof globalThis.fetch

    await engine.loadInternationalRecipes()
    const recipes = engine.getInternationalRecipes('beef')
    expect(recipes.length).toBe(1)
    expect(recipes[0].cuisine).toBe('italian')
    expect(recipes[0].name).toBe('beef stew')
  })

  it('getInternationalRecipes returns empty when no data loaded', () => {
    expect(engine.getInternationalRecipes('beef')).toEqual([])
  })
})
