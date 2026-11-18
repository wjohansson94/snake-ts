import { describe, expect, it } from 'vitest'
import { createInitialState, GRID_SIZE, isOutsideBoard, randomFreeCell, samePoint, step, togglePause, turn } from './game'
import type { GameState, Point } from './game'

function allCells(): Point[] {
  const cells: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push({ x, y })
    }
  }
  return cells
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    direction: 'right',
    nextDirection: 'right',
    queuedDirection: null,
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
      expect(cell).not.toBeNull()
      expect(snake).not.toContainEqual(cell)
    }
  })

  it('returns null when the snake fills the whole board', () => {
    expect(randomFreeCell(allCells(), () => 0)).toBeNull()
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

  it('queues a second turn behind a pending one', () => {
    const state = makeState({ direction: 'right', nextDirection: 'up' })
    const next = turn(state, 'left')
    expect(next.nextDirection).toBe('up')
    expect(next.queuedDirection).toBe('left')
  })

  it('ignores a queued turn that reverses or repeats the pending one', () => {
    const state = makeState({ direction: 'right', nextDirection: 'up' })
    expect(turn(state, 'down')).toBe(state)
    expect(turn(state, 'up')).toBe(state)
  })

  it('keeps only one queued turn', () => {
    const state = makeState({ direction: 'right', nextDirection: 'up', queuedDirection: 'left' })
    expect(turn(state, 'right')).toBe(state)
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

  it('moves on to the queued turn on the next step', () => {
    const state = makeState({ direction: 'right', nextDirection: 'up', queuedDirection: 'left' })
    const first = step(state, () => 0)
    expect(first.direction).toBe('up')
    expect(first.nextDirection).toBe('left')
    expect(first.queuedDirection).toBeNull()
    expect(step(first, () => 0).direction).toBe('left')
  })

  it('does nothing once the game is over', () => {
    const state = makeState({ status: 'gameOver' })
    expect(step(state, () => 0)).toEqual(state)
  })

  it('wins when it eats the last free cell', () => {
    const snake = allCells().slice(0, -1).reverse()
    const state = makeState({ snake, food: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 } })
    const next = step(state, () => 0)
    expect(next.status).toBe('won')
    expect(next.food).toBeNull()
    expect(next.snake).toHaveLength(GRID_SIZE * GRID_SIZE)
    expect(next.score).toBe(1)
  })
})

describe('togglePause', () => {
  it('pauses a running game', () => {
    expect(togglePause(makeState()).status).toBe('paused')
  })

  it('resumes a paused game', () => {
    expect(togglePause(makeState({ status: 'paused' })).status).toBe('playing')
  })

  it('leaves a finished game alone', () => {
    const gameOver = makeState({ status: 'gameOver' })
    const won = makeState({ status: 'won' })
    expect(togglePause(gameOver)).toBe(gameOver)
    expect(togglePause(won)).toBe(won)
  })

  it('freezes the snake while paused', () => {
    const paused = makeState({ status: 'paused' })
    expect(step(paused, () => 0)).toBe(paused)
  })
})