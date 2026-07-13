import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const PROFILES = {
  猪肝: [
    { name: '猪血', score: 0.69, reason: '同类替代', flavor: null, nutrition_sim: 0.78 },
    { name: '猪心', score: 0.58, reason: '同类替代', flavor: null, nutrition_sim: null },
  ],
  土豆: [
    { name: '山药', score: 0.7, reason: '同类替代', flavor: null, nutrition_sim: 0.92 },
  ],
}

function mockFetchOk() {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(PROFILES), { status: 200 }),
  ) as unknown as typeof globalThis.fetch
}

function mockFetch404() {
  globalThis.fetch = vi.fn(async () => new Response('', { status: 404 })) as unknown as typeof globalThis.fetch
}

async function freshModule() {
  vi.resetModules()
  return import('./useSubstituteProfiles')
}

describe('useSubstituteProfiles hook', () => {
  beforeEach(() => {
    mockFetchOk()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes getSubstitutes after the JSON loads', async () => {
    const mod = await freshModule()
    const { result } = renderHook(() => mod.useSubstituteProfiles())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    const subs = result.current.getSubstitutes('猪肝')
    expect(subs).not.toBeNull()
    expect(subs?.length).toBe(2)
    expect(subs?.[0].name).toBe('猪血')
    expect(subs?.[0].reason).toBe('同类替代')
  })

  it('returns null for unknown ingredients', async () => {
    const mod = await freshModule()
    const { result } = renderHook(() => mod.useSubstituteProfiles())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.getSubstitutes('不存在的食材')).toBeNull()
  })

  it('returns null for seasonings excluded from precompute (e.g. 酱油)', async () => {
    const mod = await freshModule()
    const { result } = renderHook(() => mod.useSubstituteProfiles())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // 酱油 is excluded by decision #7 — no entry in the JSON.
    expect(result.current.getSubstitutes('酱油')).toBeNull()
  })

  it('shares the module-level cache across hook instances (one fetch)', async () => {
    const mod = await freshModule()
    renderHook(() => mod.useSubstituteProfiles())
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))

    // A second hook instance must not trigger a second fetch.
    const { result: r2 } = renderHook(() => mod.useSubstituteProfiles())
    await waitFor(() => expect(r2.current.loading).toBe(false))
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(r2.current.getSubstitutes('土豆')?.[0].name).toBe('山药')
  })

  it('tolerates fetch failure (returns empty lookups, no throw)', async () => {
    mockFetch404()
    const mod = await freshModule()
    const { result } = renderHook(() => mod.useSubstituteProfiles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // No profile loaded → lookups return null, not throw.
    expect(result.current.getSubstitutes('猪肝')).toBeNull()
  })
})
