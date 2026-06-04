export type XpConfig = {
  baseXpPerLevel: number;
  maxLevel: number;
  startingLevel: number;
};

export const xpConfig: XpConfig = {
  baseXpPerLevel: 20,
  maxLevel: 30,
  startingLevel: 1,
};

export function xpRequiredForLevel(level: number, config: XpConfig): number {
  return config.baseXpPerLevel * level;
}
