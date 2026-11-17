import './style.css'
import { createInitialState, GRID_SIZE, step, turn } from './game'
import type { Direction, Point } from './game'

const CELL_SIZE = 20
const TICK_MS = 150

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

let state = createInitialState(Math.random)

function showScore(): void {
  const scoreElement = document.querySelector('#score')
  if (!scoreElement) {
    throw new Error('Score element #score not found')
  }
  scoreElement.textContent = String(state.score)
}

function render(ctx: CanvasRenderingContext2D): void {
  drawBoard(ctx)
  drawCell(ctx, state.food, '#f85149')
  drawSnake(ctx, state.snake)
  showScore()
  if (state.status === 'gameOver') {
    drawGameOver(ctx)
  }
}

function restart(): void {
  state = createInitialState(Math.random)
}

function tick(ctx: CanvasRenderingContext2D): void {
  state = step(state, Math.random)
  render(ctx)
}

render(context)
setInterval(() => tick(context), TICK_MS)

window.addEventListener('keydown', (event) => {
  if (state.status === 'gameOver' && (event.code === 'Enter' || event.code === 'Space')) {
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
  state = turn(state, requested)
})