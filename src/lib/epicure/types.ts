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
