/**
 * c3v2 recipe-embedding data loader.
 * Loads 9,253 ingredient embeddings (300D) from public/data/flavor-workbench/
 */

let embeddings: Float32Array | null = null;
let vocab: string[] | null = null;
let vocabIndex: Map<string, number> | null = null;
let loaded = false;

const DIMS = 300;

export async function loadC3V2Data(): Promise<void> {
  if (loaded) return;

  const [embResp, vocabResp] = await Promise.all([
    fetch('https://pub-73438d19783a40fd9e247cf1f60eb88e.r2.dev/embeddings.f32'),
    fetch('/data/flavor-workbench/vocab.json'),
  ]);

  if (!embResp.ok) throw new Error(`Failed to load embeddings: ${embResp.status}`);
  if (!vocabResp.ok) throw new Error(`Failed to load vocab: ${vocabResp.status}`);

  const [buffer, vocabData] = await Promise.all([
    embResp.arrayBuffer(),
    vocabResp.json() as Promise<string[]>,
  ]);

  embeddings = new Float32Array(buffer);
  vocab = vocabData;
  vocabIndex = new Map(vocab.map((w, i) => [w, i]));
  loaded = true;
}

export function isC3V2Loaded(): boolean {
  return loaded;
}

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

export function getEmbedding(word: string): Float32Array | null {
  if (!vocabIndex) return null;
  const idx = vocabIndex.get(word);
  if (idx === undefined) return null;
  return getRow(idx);
}

export function getNearestNeighbors(word: string, k: number = 10): Array<{ word: string; score: number }> {
  if (!vocabIndex || !embeddings) return [];
  const idx = vocabIndex.get(word);
  if (idx === undefined) return [];

  const vec = getRow(idx);
  const scores: Array<{ word: string; score: number }> = [];

  for (let i = 0; i < vocab!.length; i++) {
    if (i === idx) continue;
    const other = getRow(i);
    const sim = cosineSimilarity(vec, other);
    scores.push({ word: vocab![i], score: sim });
  }

  return scores.sort((a, b) => b.score - a.score).slice(0, k);
}

export function getVocab(): string[] {
  return vocab || [];
}

export function searchVocab(query: string, limit: number = 10): string[] {
  if (!vocab) return [];
  const q = query.toLowerCase();
  return vocab
    .filter(w => w.toLowerCase().includes(q))
    .slice(0, limit);
}
