export const GRID_SIZE = 20

export type Point = { x: number; y: number }

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameState = {
  snake: Point[]
  direction: Direction
  nextDirection: Direction
  queuedDirection: Direction | null
  food: Point | null
  score: number
  status: 'playing' | 'paused' | 'gameOver' | 'won'
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function isOutsideBoard(cell: Point): boolean {
  return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE
}

export function randomFreeCell(snake: Point[], random: () => number): Point | null {
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = { x, y }
      if (!snake.some((segment) => samePoint(segment, cell))) {
        freeCells.push(cell)
      }
    }
  }
  if (freeCells.length === 0) {
    return null
  }
  return freeCells[Math.floor(random() * freeCells.length)]
}

export function createInitialState(random: () => number): GameState {
  const snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]
  return {
    snake,
    direction: 'right',
    nextDirection: 'right',
    queuedDirection: null,
    food: randomFreeCell(snake, random),
    score: 0,
    status: 'playing',
  }
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export function turn(state: GameState, requested: Direction): GameState {
  if (state.nextDirection === state.direction) {
    // Nothing pending: compare with the last move made
    if (requested === OPPOSITE[state.direction]) {
      return state
    }
    return { ...state, nextDirection: requested }
  }
  // One turn is pending: remember a second one so fast key presses are not lost
  const pending = state.nextDirection
  if (state.queuedDirection !== null || requested === pending || requested === OPPOSITE[pending]) {
    return state
  }
  return { ...state, queuedDirection: requested }
}

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function step(state: GameState, random: () => number): GameState {
  if (state.status !== 'playing') {
    return state
  }

  const direction = state.nextDirection
  const vector = DIRECTION_VECTORS[direction]
  const head = state.snake[0]
  const newHead = { x: head.x + vector.x, y: head.y + vector.y }
  const ate = state.food !== null && samePoint(newHead, state.food)
  // The tail moves away this tick unless the snake grows
  const body = ate ? state.snake : state.snake.slice(0, -1)
  const hitsSelf = body.some((segment) => samePoint(segment, newHead))

  if (isOutsideBoard(newHead) || hitsSelf) {
    return { ...state, status: 'gameOver' }
  }

  const snake = [newHead, ...body]
  const food = ate ? randomFreeCell(snake, random) : state.food

  return {
    ...state,
    snake,
    direction,
    nextDirection: state.queuedDirection ?? direction,
    queuedDirection: null,
    score: ate ? state.score + 1 : state.score,
    food,
    status: food === null ? 'won' : 'playing',
  }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'playing') {
    return { ...state, status: 'paused' }
  }
  if (state.status === 'paused') {
    return { ...state, status: 'playing' }
  }
  return state
}