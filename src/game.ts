export const GRID_SIZE = 20

export type Point = { x: number; y: number }

export type Direction = 'up' | 'down' | 'left' | 'right'

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function isOutsideBoard(cell: Point): boolean {
  return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE
}