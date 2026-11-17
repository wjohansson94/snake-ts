import { describe, expect, it } from 'vitest'
import { createInitialState, GRID_SIZE, isOutsideBoard, randomFreeCell, samePoint, step, turn } from './game'
import type { GameState } from './game'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    direction: 'right',
    nextDirection: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    status: 'playing',
    ...overrides,
  }
}

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

describe('randomFreeCell', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]

  it('picks the first free cell when random returns 0', () => {
    expect(randomFreeCell(snake, () => 0)).toEqual({ x: 2, y: 0 })
  })

  it('picks the last free cell when random returns just below 1', () => {
    expect(randomFreeCell(snake, () => 0.999)).toEqual({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })
  })

  it('never picks a cell the snake occupies', () => {
    for (let i = 0; i < 100; i++) {
      const cell = randomFreeCell(snake, () => i / 100)
      expect(snake.some((segment) => samePoint(segment, cell))).toBe(false)
    }
  })
})

describe('createInitialState', () => {
  it('starts with a three-segment snake heading right', () => {
    const state = createInitialState(() => 0)
    expect(state.snake).toHaveLength(3)
    expect(state.snake[0]).toEqual({ x: 10, y: 10 })
    expect(state.direction).toBe('right')
    expect(state.nextDirection).toBe('right')
  })

  it('starts a running game with score 0', () => {
    const state = createInitialState(() => 0)
    expect(state.status).toBe('playing')
    expect(state.score).toBe(0)
  })

  it('places the food on a free cell chosen by random', () => {
    expect(createInitialState(() => 0).food).toEqual({ x: 0, y: 0 })
    expect(createInitialState(() => 0.999).food).toEqual({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })
  })
})

describe('turn', () => {
  it('stores a sideways turn without changing the original state', () => {
    const state = makeState({ direction: 'right' })
    const next = turn(state, 'up')
    expect(next.nextDirection).toBe('up')
    expect(state.nextDirection).toBe('right')
  })

  it('ignores an instant reversal', () => {
    const state = makeState({ direction: 'right' })
    expect(turn(state, 'left')).toEqual(state)
  })

  it('compares with the last move made, not the pending turn', () => {
    const state = makeState({ direction: 'right', nextDirection: 'up' })
    expect(turn(state, 'left').nextDirection).toBe('up')
  })
})

describe('step', () => {
  it('moves the snake one cell in the pending direction', () => {
    const state = makeState({ nextDirection: 'up' })
    const next = step(state, () => 0)
    expect(next.snake).toHaveLength(3)
    expect(next.snake[0]).toEqual({ x: 10, y: 9 })
    expect(next.snake[2]).toEqual({ x: 9, y: 10 })
    expect(next.direction).toBe('up')
    expect(next.score).toBe(0)
  })

  it('grows, scores and places new food when it eats', () => {
    const state = makeState({ food: { x: 11, y: 10 } })
    const next = step(state, () => 0)
    expect(next.snake).toHaveLength(4)
    expect(next.snake[0]).toEqual({ x: 11, y: 10 })
    expect(next.score).toBe(1)
    expect(next.food).toEqual({ x: 0, y: 0 })
  })

  it('does not change the original state', () => {
    const state = makeState({ food: { x: 11, y: 10 } })
    const copy = structuredClone(state)
    step(state, () => 0)
    expect(state).toEqual(copy)
  })

  it('ends the game when the snake hits a wall', () => {
    const snake = [
      { x: GRID_SIZE - 1, y: 5 },
      { x: GRID_SIZE - 2, y: 5 },
    ]
    const state = makeState({ snake })
    expect(step(state, () => 0).status).toBe('gameOver')
  })

  it('ends the game when the snake runs into itself', () => {
    const snake = [
      { x: 9, y: 11 },
      { x: 10, y: 11 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]
    const state = makeState({ snake, direction: 'left', nextDirection: 'up' })
    expect(step(state, () => 0).status).toBe('gameOver')
  })

  it('lets the head move into the cell the tail leaves', () => {
    const snake = [
      { x: 9, y: 11 },
      { x: 10, y: 11 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
    ]
    const state = makeState({ snake, direction: 'left', nextDirection: 'up' })
    expect(step(state, () => 0).status).toBe('playing')
  })

  it('does nothing once the game is over', () => {
    const state = makeState({ status: 'gameOver' })
    expect(step(state, () => 0)).toEqual(state)
  })
})