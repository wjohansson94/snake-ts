import './style.css'

const GRID_SIZE = 20
const CELL_SIZE = 20

type Point = { x: number; y: number }

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

const snake: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

drawBoard(context)

drawSnake(context, snake)