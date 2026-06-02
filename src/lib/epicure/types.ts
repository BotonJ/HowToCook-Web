export interface PairingResult {
  name: string;
  nameZh: string;
  score: number;
}

export interface ModeResult {
  modeId: string;
  kind: string;
  property: string;
  label: string;
  score: number;
  nMembers: number;
  members: string[];
}

export interface CuisinePole {
  key: string;
  label: string;
}

export interface FlavorVector {
  sweet: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fatty: number;
}

export interface FlavorProfile extends FlavorVector {
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  nRecipes: number;
}

export interface CooccurrencePair {
  ingredient: string;
  pmi: number;
  count: number;
}

export interface InternationalRecipe {
  id: string;
  cuisine: string;
  name: string;
}
