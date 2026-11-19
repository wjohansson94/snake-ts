import './style.css'
import { createInitialState, GRID_SIZE, step, togglePause, turn } from './game'
import type { Direction, Point } from './game'
import { loadHighScore, saveHighScore } from './high-score'

const CELL_SIZE = 20
type Difficulty = 'easy' | 'normal' | 'hard'
// Milliseconds per move: a lower number means a faster snake
const TICK_MS: Record<Difficulty, number> = { easy: 200, normal: 150, hard: 90 }
// A touch must travel this many pixels before it counts as a swipe
const SWIPE_DISTANCE = 24

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

const OVERLAYS = {
  paused: { title: 'Paused', hint: 'Press P or Escape to resume' },
  gameOver: { title: 'Game over', hint: 'Press Enter or Space to restart' },
  won: { title: 'You win!', hint: 'Press Enter or Space to restart' },
}

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Element ${selector} not found`)
  }
  return element
}

const canvas = getElement<HTMLCanvasElement>('#game')
const scoreElement = getElement('#score')
const bestElement = getElement('#best')
const statusElement = getElement('#status')
const difficultySelect = getElement<HTMLSelectElement>('#difficulty')
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

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, hint: string): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  ctx.fillStyle = 'rgba(11, 12, 16, 0.75)'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#f3f4f6'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillText(title, width / 2, height / 2 - 14)
  ctx.font = '16px system-ui, sans-serif'
  ctx.fillText(hint, width / 2, height / 2 + 22)
}

let state = createInitialState(Math.random)
let bestScore = loadHighScore()

// Only touch the DOM when the text changes, so screen readers are not interrupted every tick
function setText(element: Element, text: string): void {
  if (element.textContent !== text) {
    element.textContent = text
  }
}

function showScore(): void {
  if (state.score > bestScore) {
    bestScore = state.score
    saveHighScore(bestScore)
  }
  setText(scoreElement, String(state.score))
  setText(bestElement, String(bestScore))
}

function render(ctx: CanvasRenderingContext2D): void {
  drawBoard(ctx)
  if (state.food) {
    drawCell(ctx, state.food, '#f85149')
  }
  drawSnake(ctx, state.snake)
  showScore()
  if (state.status === 'playing') {
    setText(statusElement, '')
  } else {
    const overlay = OVERLAYS[state.status]
    drawOverlay(ctx, overlay.title, overlay.hint)
    setText(statusElement, `${overlay.title}. Score ${state.score}.`)
  }
}

function restart(): void {
  state = createInitialState(Math.random)
}

function isFinished(): boolean {
  return state.status === 'gameOver' || state.status === 'won'
}

function toggleOrRestart(ctx: CanvasRenderingContext2D): void {
  if (isFinished()) {
    restart()
  } else {
    state = togglePause(state)
  }
  render(ctx)
}

function tick(ctx: CanvasRenderingContext2D): void {
  state = step(state, Math.random)
  render(ctx)
}

render(context)
let timer = setInterval(() => tick(context), TICK_MS[difficultySelect.value as Difficulty])

difficultySelect.addEventListener('change', () => {
  clearInterval(timer)
  timer = setInterval(() => tick(context), TICK_MS[difficultySelect.value as Difficulty])
  restart()
  render(context)
  // Give the focus back to the page so the arrow keys steer the snake, not the list
  difficultySelect.blur()
})

window.addEventListener('keydown', (event) => {
  // Leave browser shortcuts like Ctrl+R or Ctrl+S alone
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return
  }

  if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) {
    event.preventDefault()
    if (!isFinished()) {
      state = togglePause(state)
      render(context)
    }
    return
  }

  if (isFinished() && ['Enter', 'NumpadEnter', 'Space'].includes(event.code)) {
    event.preventDefault()
    restart()
    render(context)
    return
  }

  const requested = KEY_TO_DIRECTION[event.code]
  if (!requested) {
    return
  }
  // preventDefault stops the arrow keys from scrolling the page
  event.preventDefault()
  state = turn(state, requested)
})

// A hidden tab has no one watching, so pause instead of letting the snake crash
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.status === 'playing') {
    state = togglePause(state)
    render(context)
  }
})

let touchStart: Point | null = null
let swiped = false

canvas.addEventListener('pointerdown', (event) => {
  // Keep receiving events even if the finger or mouse leaves the board
  canvas.setPointerCapture(event.pointerId)
  touchStart = { x: event.clientX, y: event.clientY }
  swiped = false
})

canvas.addEventListener('pointermove', (event) => {
  if (!touchStart) {
    return
  }
  const dx = event.clientX - touchStart.x
  const dy = event.clientY - touchStart.y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) {
    return
  }
  const horizontal = Math.abs(dx) > Math.abs(dy)
  const requested: Direction = horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
  state = turn(state, requested)
  // Start measuring again so one long swipe can chain several turns
  touchStart = { x: event.clientX, y: event.clientY }
  swiped = true
})

canvas.addEventListener('pointerup', () => {
  if (touchStart && !swiped) {
    toggleOrRestart(context)
  }
  touchStart = null
})

canvas.addEventListener('pointercancel', () => {
  touchStart = null
})