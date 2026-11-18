import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from './game'
import { parseHighScore } from './high-score'

describe('parseHighScore', () => {
  it('reads a stored whole number', () => {
    expect(parseHighScore('12')).toBe(12)
  })

  it('returns 0 when nothing is stored', () => {
    expect(parseHighScore(null)).toBe(0)
  })

  it('returns 0 for values that are not whole non-negative numbers', () => {
    for (const raw of ['', 'abc', '-3', '2.5', '1e3', ' 4', 'NaN', 'Infinity']) {
      expect(parseHighScore(raw)).toBe(0)
    }
  })

  it('returns 0 for a score no game could reach', () => {
    expect(parseHighScore(String(GRID_SIZE * GRID_SIZE + 1))).toBe(0)
  })
})
