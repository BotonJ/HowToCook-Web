import type { FlavorProfile } from '@/lib/epicure/types';

let profiles: Record<string, FlavorProfile> | null = null;

export async function loadFlavorProfiles(): Promise<void> {
  if (profiles) return;
  const resp = await fetch('/data/epicure/ingredient-flavor-profiles.json');
  if (!resp.ok) throw new Error(`Failed to load flavor profiles: ${resp.status}`);
  profiles = (await resp.json()) as Record<string, FlavorProfile>;
}

export function getFlavorProfile(id: string): FlavorProfile | null {
  return profiles?.[id] ?? null;
}

export function getConfidenceTier(id: string): 1 | 2 | 3 | 4 {
  return profiles?.[id]?.tier ?? 4;
}

export function hasFlavorData(id: string): boolean {
  const tier = profiles?.[id]?.tier;
  return tier === 1 || tier === 2 || tier === 3;
}

export function isFlavorProfilesLoaded(): boolean {
  return profiles !== null;
}

export function getAllFlavorProfiles(): Record<string, FlavorProfile> | null {
  return profiles;
}
