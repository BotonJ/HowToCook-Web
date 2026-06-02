import type { PairingResult, ModeResult, CuisinePole, CooccurrencePair, InternationalRecipe } from './types';

interface RawMetadata {
  version: string;
  n_ingredients: number;
  n_dims: number;
  vocab: Record<string, number>;
  itos: string[];
  cuisinePoles: Record<string, number[]>;
  modes: Array<{
    id: string;
    kind: string;
    property: string;
    label: string;
    n_members: number;
    members: string[];
  }>;
}

let embeddings: Float32Array | null = null;
let meta: RawMetadata | null = null;
let zhMap: Record<string, string> | null = null;
let zhReverse: Map<string, string> | null = null; // zh -> en reverse index
let modeLabelsZh: Record<string, string> | null = null;
const DIMS = 300;

// Precomputed recipe embeddings (lazy loaded)
let precomputedRecipeEmbeddings: Map<string, Float32Array> | null = null;
let precomputedRecipeEmbeddingsLoading: Promise<Map<string, Float32Array> | null> | null = null;

// Cooccurrence data (lazy loaded)
let cooccurrenceAdjacency: Record<string, Array<{ ingredient: string; pmi: number; count: number }>> | null = null;
let cooccurrenceLoading: Promise<void> | null = null;

// International recipes data (lazy loaded)
let internationalRecipes: Record<string, string[]> | null = null;
let internationalRecipesLoading: Promise<void> | null = null;

function getRow(i: number): Float32Array {
  return embeddings!.subarray(i * DIMS, (i + 1) * DIMS);
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function formatName(raw: string): string {
  return raw.replace(/_/g, ' ');
}

function toPascalCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c);
}

function getZhName(en: string): string {
  return zhMap?.[en] ?? '';
}

export async function loadData(): Promise<void> {
  if (embeddings && meta) return;

  const [embResp, metaResp] = await Promise.all([
    fetch('/data/epicure/embeddings.f32'),
    fetch('/data/epicure/metadata.json'),
  ]);

  if (!embResp.ok) throw new Error(`Failed to load embeddings: ${embResp.status}`);
  if (!metaResp.ok) throw new Error(`Failed to load metadata: ${metaResp.status}`);

  const [buffer, metaData, zhData, modeZhData] = await Promise.all([
    embResp.arrayBuffer(),
    metaResp.json() as Promise<RawMetadata>,
    fetch('/data/epicure/epicure_vocab_zh.json').then(async (r) => {
      if (!r.ok) return {} as Record<string, string>;
      return r.json() as Promise<Record<string, string>>;
    }).catch(() => ({} as Record<string, string>)),
    fetch('/data/epicure/mode-labels-zh.json').then(async (r) => {
      if (!r.ok) return {} as Record<string, string>;
      return r.json() as Promise<Record<string, string>>;
    }).catch(() => ({} as Record<string, string>)),
  ]);

  embeddings = new Float32Array(buffer);
  meta = metaData;
  zhMap = zhData;
  modeLabelsZh = modeZhData;

  // Build reverse index: zh -> en
  zhReverse = new Map();
  for (const [en, zh] of Object.entries(zhData)) {
    zhReverse.set(zh, en);
  }

}

export function isLoaded(): boolean {
  return embeddings !== null && meta !== null;
}

export function getVocabSize(): number {
  return meta?.n_ingredients ?? 0;
}

export function getNearestNeighbors(ingredient: string, k: number): PairingResult[] {
  if (!meta) return [];

  const idx = meta.vocab[ingredient];
  if (idx === undefined) return [];

  const vec = getRow(idx);
  const scores: Array<{ idx: number; score: number }> = [];

  for (let i = 0; i < meta.n_ingredients; i++) {
    if (i === idx) continue;
    const score = cosineSimilarity(vec, getRow(i));
    scores.push({ idx: i, score });
  }

  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, k).map(({ idx: i, score }) => ({
    name: formatName(meta!.itos[i]),
    nameZh: getZhName(meta!.itos[i]),
    score,
  }));
}

export function slerp(
  seed: string,
  direction: string,
  angleDeg: number,
  k: number,
): PairingResult[] {
  if (!meta) return [];

  const seedIdx = meta.vocab[seed];
  const dirIdx = meta.vocab[direction];
  if (seedIdx === undefined || dirIdx === undefined) return [];

  const seedVec = getRow(seedIdx);
  const dirVec = getRow(dirIdx);

  // Normalize seed
  const seedNorm = Math.sqrt(seedVec.reduce((s, v) => s + v * v, 0));
  if (seedNorm === 0) return [];
  const s = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) s[i] = seedVec[i] / seedNorm;

  // Gram-Schmidt: orthogonalize direction against seed
  let dotSD = 0;
  for (let i = 0; i < DIMS; i++) dotSD += s[i] * dirVec[i];
  const dPerp = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) dPerp[i] = dirVec[i] - dotSD * s[i];

  const dPerpNorm = Math.sqrt(dPerp.reduce((acc, v) => acc + v * v, 0));
  if (dPerpNorm === 0) return [];
  for (let i = 0; i < DIMS; i++) dPerp[i] /= dPerpNorm;

  // q = cos(theta) * seed + sin(theta) * d_perp
  const theta = (angleDeg * Math.PI) / 180;
  const q = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) {
    q[i] = Math.cos(theta) * s[i] + Math.sin(theta) * dPerp[i];
  }

  const scores: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < meta.n_ingredients; i++) {
    if (i === seedIdx) continue;
    const score = cosineSimilarity(q, getRow(i));
    scores.push({ idx: i, score });
  }

  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, k).map(({ idx: i, score }) => ({
    name: formatName(meta!.itos[i]),
    nameZh: getZhName(meta!.itos[i]),
    score,
  }));
}

export function getClosestMode(ingredient: string, k: number): ModeResult[] {
  if (!meta) return [];

  const idx = meta.vocab[ingredient];
  if (idx === undefined) return [];

  const vec = getRow(idx);
  const results: ModeResult[] = meta.modes.map((mode) => {
    const memberIndices = mode.members
      .map((m) => meta!.vocab[m])
      .filter((i): i is number => i !== undefined);

    if (memberIndices.length === 0) {
      return {
        modeId: `${mode.property}/${mode.label}`,
        kind: mode.kind,
        property: mode.property,
        label: mode.label,
        score: 0,
        nMembers: mode.n_members,
        members: mode.members.slice(0, 10),
      };
    }

    let totalScore = 0;
    for (const mi of memberIndices) {
      totalScore += cosineSimilarity(vec, getRow(mi));
    }

    return {
      modeId: `${mode.property}/${mode.label}`,
      kind: mode.kind,
      property: mode.property,
      label: mode.label,
      score: totalScore / memberIndices.length,
      nMembers: mode.n_members,
      members: mode.members.slice(0, 10),
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}

export function searchVocabulary(query: string, limit: number): string[] {
  if (!meta) return [];

  const q = query.toLowerCase().replace(/ /g, '_');
  const seen = new Set<string>();
  const matches: string[] = [];

  // Chinese reverse lookup first
  if (zhReverse) {
    for (const [zh, en] of zhReverse) {
      if (zh.includes(query) && !seen.has(en)) {
        seen.add(en);
        matches.push(en);
      }
    }
  }

  // English prefix / substring match
  for (const name of meta.itos) {
    if (seen.has(name)) continue;
    if (name.startsWith(q) || name.includes(q)) {
      seen.add(name);
      matches.push(name);
    }
    if (matches.length >= limit) break;
  }

  return matches.slice(0, limit);
}

const CUISINE_ZH: Record<string, string> = {
  East_Asian: '东亚',
  Southeast_Asian: '东南亚',
  South_Asian: '南亚',
  Mediterranean: '地中海',
  Western_Atlantic: '西洋',
  Eastern_European: '东欧',
  Latin_American: '拉美',
};

export function getCuisinePoles(): CuisinePole[] {
  if (!meta) return [];
  return Object.keys(meta.cuisinePoles).map((key) => ({
    key,
    label: CUISINE_ZH[key] ?? toPascalCase(key),
  }));
}

export function slerpToCuisine(
  seed: string,
  cuisineKey: string,
  angleDeg: number,
  k: number,
): PairingResult[] {
  if (!meta) return [];

  const seedIdx = meta.vocab[seed];
  const poleArr = meta.cuisinePoles[cuisineKey];
  if (seedIdx === undefined || !poleArr) return [];

  const seedVec = getRow(seedIdx);
  const dirVec = new Float32Array(poleArr);

  // Normalize seed
  const seedNorm = Math.sqrt(seedVec.reduce((s, v) => s + v * v, 0));
  if (seedNorm === 0) return [];
  const s = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) s[i] = seedVec[i] / seedNorm;

  // Gram-Schmidt: orthogonalize direction against seed
  let dotSD = 0;
  for (let i = 0; i < DIMS; i++) dotSD += s[i] * dirVec[i];
  const dPerp = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) dPerp[i] = dirVec[i] - dotSD * s[i];

  const dPerpNorm = Math.sqrt(dPerp.reduce((acc, v) => acc + v * v, 0));
  if (dPerpNorm === 0) return [];
  for (let i = 0; i < DIMS; i++) dPerp[i] /= dPerpNorm;

  const theta = (angleDeg * Math.PI) / 180;
  const q = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) {
    q[i] = Math.cos(theta) * s[i] + Math.sin(theta) * dPerp[i];
  }

  const scores: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < meta.n_ingredients; i++) {
    if (i === seedIdx) continue;
    const score = cosineSimilarity(q, getRow(i));
    scores.push({ idx: i, score });
  }

  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, k).map(({ idx: i, score }) => ({
    name: formatName(meta!.itos[i]),
    nameZh: getZhName(meta!.itos[i]),
    score,
  }));
}

export function getIngredientIndex(name: string): number | undefined {
  return meta?.vocab[name];
}

export function getIngredientName(index: number): string | undefined {
  return meta?.itos[index];
}

export function getEmbedding(index: number): Float32Array | null {
  if (!embeddings) return null;
  return getRow(index);
}

/**
 * Cached recipe embeddings — computed once per session, shared across components.
 * Tries precomputed binary file first, falls back to runtime computation.
 */
let cachedRecipeEmbeddings: Map<string, Float32Array> | null = null;

export async function loadPrecomputedRecipeEmbeddings(
  recipeIds: string[],
): Promise<Map<string, Float32Array> | null> {
  if (precomputedRecipeEmbeddings) return precomputedRecipeEmbeddings;
  if (precomputedRecipeEmbeddingsLoading) return precomputedRecipeEmbeddingsLoading;

  precomputedRecipeEmbeddingsLoading = (async () => {
    try {
      const resp = await fetch('/data/epicure/recipe-embeddings.f32');
      if (!resp.ok) return null;
      const buffer = await resp.arrayBuffer();
      const floats = new Float32Array(buffer);
      const nRecipes = floats.length / DIMS;

      if (nRecipes !== recipeIds.length) {
        console.warn(
          `recipe-embeddings.f32 has ${nRecipes} entries but recipes.json has ${recipeIds.length}. Falling back to runtime computation.`,
        );
        return null;
      }

      const map = new Map<string, Float32Array>();
      for (let i = 0; i < nRecipes; i++) {
        map.set(recipeIds[i], floats.subarray(i * DIMS, (i + 1) * DIMS));
      }
      precomputedRecipeEmbeddings = map;
      return map;
    } catch {
      return null;
    }
  })();

  return precomputedRecipeEmbeddingsLoading;
}

export function getOrComputeRecipeEmbeddings(
  recipes: Array<{ id: string; ingredients: string[] }>,
): Map<string, Float32Array> {
  if (cachedRecipeEmbeddings) return cachedRecipeEmbeddings;

  // If precomputed is available, use it
  if (precomputedRecipeEmbeddings) {
    cachedRecipeEmbeddings = precomputedRecipeEmbeddings;
    return cachedRecipeEmbeddings;
  }

  // Fallback: compute at runtime
  const computed = computeRecipeEmbeddings(recipes);
  const map = new Map<string, Float32Array>();
  for (const r of computed) {
    map.set(r.id, r.embedding);
  }
  cachedRecipeEmbeddings = map;
  return map;
}

// ---------------------------------------------------------------------------
// Cooccurrence data (lazy loaded)
// ---------------------------------------------------------------------------

export async function loadCooccurrenceData(): Promise<void> {
  if (cooccurrenceAdjacency) return;
  if (cooccurrenceLoading) return cooccurrenceLoading;

  cooccurrenceLoading = (async () => {
    try {
      const resp = await fetch('/data/epicure/ingredient-cooccurrence.json');
      if (!resp.ok) return;
      const data = await resp.json() as {
        adjacency: Record<string, Array<{ ingredient: string; pmi: number; count: number }>>;
      };
      cooccurrenceAdjacency = data.adjacency ?? {};
    } catch {
      cooccurrenceAdjacency = {};
    }
  })();

  return cooccurrenceLoading;
}

export function getCooccurrencePairs(
  ingredient: string,
  zhName: string,
  k: number,
): CooccurrencePair[] {
  if (!cooccurrenceAdjacency) return [];

  // Try Chinese name first (cooccurrence data uses Chinese names)
  const results = cooccurrenceAdjacency[zhName];
  if (results) {
    return results
      .sort((a, b) => b.pmi - a.pmi)
      .slice(0, k)
      .map((r) => ({ ingredient: r.ingredient, pmi: r.pmi, count: r.count }));
  }

  // Fallback: try English name
  const enName = ingredient.replace(/ /g, '_');
  const enResults = cooccurrenceAdjacency[enName];
  if (enResults) {
    return enResults
      .sort((a, b) => b.pmi - a.pmi)
      .slice(0, k)
      .map((r) => ({ ingredient: r.ingredient, pmi: r.pmi, count: r.count }));
  }

  return [];
}

// ---------------------------------------------------------------------------
// International recipes (lazy loaded)
// ---------------------------------------------------------------------------

export async function loadInternationalRecipes(): Promise<void> {
  if (internationalRecipes) return;
  if (internationalRecipesLoading) return internationalRecipesLoading;

  internationalRecipesLoading = (async () => {
    try {
      const resp = await fetch('/data/epicure/ingredient-recipes-flat.json');
      if (!resp.ok) return;
      internationalRecipes = await resp.json();
    } catch {
      internationalRecipes = {};
    }
  })();

  return internationalRecipesLoading;
}

export function getInternationalRecipes(ingredient: string): InternationalRecipe[] {
  if (!internationalRecipes) return [];

  const recipes = internationalRecipes[ingredient];
  if (!recipes || recipes.length === 0) return [];

  return recipes.map((id: string) => {
    // Parse "recipenlg/cuisine/recipe name" format
    const parts = id.split('/');
    const cuisine = parts.length >= 2 ? parts[1] : 'unknown';
    const name = parts.length >= 3 ? parts.slice(2).join('/') : id;
    return { id, cuisine, name };
  });
}

export function computeRecipeEmbeddings(
  recipes: Array<{ id: string; ingredients: string[] }>,
): Array<{ id: string; embedding: Float32Array }> {
  if (!embeddings || !meta) return [];

  const results: Array<{ id: string; embedding: Float32Array }> = [];

  for (const recipe of recipes) {
    const vecs: Float32Array[] = [];
    for (const ing of recipe.ingredients) {
      const idx = meta.vocab[ing];
      if (idx !== undefined) {
        vecs.push(getRow(idx));
      }
    }

    if (vecs.length === 0) continue;

    const avg = new Float32Array(DIMS);
    for (let d = 0; d < DIMS; d++) {
      let sum = 0;
      for (const v of vecs) sum += v[d];
      avg[d] = sum / vecs.length;
    }
    results.push({ id: recipe.id, embedding: avg });
  }

  return results;
}

export function getZhMap(): Record<string, string> {
  return zhMap ?? {};
}

export function getModeLabelZh(enLabel: string): string {
  return modeLabelsZh?.[enLabel] ?? '';
}

export function getModeLabelsZh(): Record<string, string> {
  return modeLabelsZh ?? {};
}

/**
 * Reverse lookup: Chinese name → Epicure English name.
 * Returns empty string if not found.
 */
export function getEnName(zhName: string): string {
  return zhReverse?.get(zhName) ?? '';
}
