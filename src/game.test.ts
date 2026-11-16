import { describe, expect, it } from 'vitest'
import { GRID_SIZE, isOutsideBoard, samePoint } from './game'

describe('samePoint', () => {
  it('is true for cells with the same coordinates', () => {
    expect(samePoint({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(true)
  })

  it('is false when x differs', () => {
    expect(samePoint({ x: 3, y: 4 }, { x: 5, y: 4 })).toBe(false)
  })

  it('is false when y differs', () => {
    expect(samePoint({ x: 3, y: 4 }, { x: 3, y: 5 })).toBe(false)
  })
})

describe('isOutsideBoard', () => {
  it('is false for cells inside the board', () => {
    expect(isOutsideBoard({ x: 0, y: 0 })).toBe(false)
    expect(isOutsideBoard({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(false)
  })

  it('is true just outside each edge', () => {
    expect(isOutsideBoard({ x: -1, y: 0 })).toBe(true)
    expect(isOutsideBoard({ x: GRID_SIZE, y: 0 })).toBe(true)
    expect(isOutsideBoard({ x: 0, y: -1 })).toBe(true)
    expect(isOutsideBoard({ x: 0, y: GRID_SIZE })).toBe(true)
  })
})