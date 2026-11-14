import './style.css'

const GRID_SIZE = 20
const CELL_SIZE = 20
const TICK_MS = 150

type Point = { x: number; y: number }

type Direction = 'up' | 'down' | 'left' | 'right'

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const KEY_TO_DIRECTION: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const canvas = document.querySelector<HTMLCanvasElement>('#game')

if (!canvas) {
  throw new Error('Canvas element #game not found')
}

canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const context = canvas.getContext('2d')
if (!context) {
  throw new Error('2D canvas is not supported')
}

function drawBoard(ctx: CanvasRenderingContext2D): void {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1b1d24' : '#23262f'
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }
}

function drawCell(ctx: CanvasRenderingContext2D, cell: Point, color: string): void {
  ctx.fillStyle = color
  // Inset by 1 px on every side so neighboring cells get a thin gap
  ctx.fillRect(cell.x * CELL_SIZE + 1, cell.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
}

function drawSnake(ctx: CanvasRenderingContext2D, segments: Point[]): void {
  segments.forEach((segment, index) => {
    drawCell(ctx, segment, index === 0 ? '#7ee787' : '#3fb950')
  })
}

function drawGameOver(ctx: CanvasRenderingContext2D): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  ctx.fillStyle = 'rgba(11, 12, 16, 0.75)'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#f3f4f6'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillText('Game over', width / 2, height / 2 - 14)
  ctx.font = '16px system-ui, sans-serif'
  ctx.fillText('Press Enter or Space to restart', width / 2, height / 2 + 22)
}

function createSnake(): Point[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]
}

let snake = createSnake()

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function isOutsideBoard(cell: Point): boolean {
  return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE
}

function randomFreeCell(): Point {
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = { x, y }
      if (!snake.some((segment) => samePoint(segment, cell))) {
        freeCells.push(cell)
      }
    }
  }
  return freeCells[Math.floor(Math.random() * freeCells.length)]
}

let direction: Direction = 'right'
let nextDirection: Direction = 'right'
let food = randomFreeCell()
let score = 0
let gameOver = false

function showScore(): void {
  const scoreElement = document.querySelector('#score')
  if (!scoreElement) {
    throw new Error('Score element #score not found')
  }
  scoreElement.textContent = String(score)
}

function moveSnake(): void {
  direction = nextDirection
  const vector = DIRECTION_VECTORS[direction]
  const head = snake[0]
  const newHead = { x: head.x + vector.x, y: head.y + vector.y }
  const ate = samePoint(newHead, food)
  // The tail moves away this tick unless the snake grows
  const body = ate ? snake : snake.slice(0, -1)
  const hitsSelf = body.some((segment) => samePoint(segment, newHead))

  if (isOutsideBoard(newHead) || hitsSelf) {
    gameOver = true
    return
  }

  snake.unshift(newHead)
  if (ate) {
    score++
    showScore()
    food = randomFreeCell()
  } else {
    snake.pop()
  }
}

function render(ctx: CanvasRenderingContext2D): void {
  drawBoard(ctx)
  drawCell(ctx, food, '#f85149')
  drawSnake(ctx, snake)
  if (gameOver) {
    drawGameOver(ctx)
  }
}

function restart(): void {
  snake = createSnake()
  direction = 'right'
  nextDirection = 'right'
  food = randomFreeCell()
  score = 0
  gameOver = false
  showScore()
}

function tick(ctx: CanvasRenderingContext2D): void {
  if (gameOver) {
    return
  }
  moveSnake()
  render(ctx)
}

render(context)
setInterval(() => tick(context), TICK_MS)

window.addEventListener('keydown', (event) => {
  if (gameOver && (event.code === 'Enter' || event.code === 'Space')) {
    event.preventDefault()
    restart()
    render(context)
    return
  }

  const requested = KEY_TO_DIRECTION[event.code]
  if (!requested) {
    return
  }
  event.preventDefault()
  // Compare with the last move made, not the pending one
  if (requested !== OPPOSITE[direction]) {
    nextDirection = requested
  }
})