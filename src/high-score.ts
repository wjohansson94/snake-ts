import { GRID_SIZE } from './game'

const STORAGE_KEY = 'snake-ts:high-score'
const MAX_SCORE = GRID_SIZE * GRID_SIZE

// localStorage can hold anything (or be edited by hand), so only trust a sane whole number
export function parseHighScore(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) {
    return 0
  }
  const value = Number(raw)
  return value <= MAX_SCORE ? value : 0
}

export function loadHighScore(): number {
  try {
    return parseHighScore(localStorage.getItem(STORAGE_KEY))
  } catch {
    // Storage can be blocked (private mode, browser settings)
    return 0
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score))
  } catch {
    // Not saving is fine; the score still shows for this session
  }
}
