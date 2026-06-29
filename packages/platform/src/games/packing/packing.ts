// Packing — pure game logic.
//
// Pack a set of rectangles into a container of fixed width. The
// goal is to minimize the container height. Used as a constraint
// satisfaction problem.
//
// Educational version: pack 3-5 rectangles into a 10x10 container.
// Player places rectangles, game checks fit and updates grid.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type Rect = { id: number; w: number; h: number; x?: number; y?: number }
export type PackingState = {
  width: number
  /** The placed rectangles (id → position). */
  placed: Map<number, { x: number; y: number }>
  /** The grid. 0 = empty, otherwise the rect's id. */
  grid: number[][]
  moves: number
}

export function newGame(width: number = 10, seed: number = 0): { state: PackingState; pieces: Rect[] } {
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  // Generate 4 random rectangles
  const pieces: Rect[] = []
  for (let i = 0; i < 4; i++) {
    const w = 2 + Math.floor(rand() * 4)
    const h = 2 + Math.floor(rand() * 4)
    pieces.push({ id: i, w, h })
  }
  const grid: number[][] = []
  for (let r = 0; r < 20; r++) {
    grid.push(new Array(width).fill(0))
  }
  return {
    state: { width, placed: new Map(), grid, moves: 0 },
    pieces,
  }
}

/** Engine-friendly alias. */
export function newPuzzle(width: number = 10, seed: number = 0): PackingState {
  return newGame(width, seed).state
}

export function canPlace(state: PackingState, rect: Rect, x: number, y: number): boolean {
  if (x < 0 || y < 0) return false
  if (x + rect.w > state.width) return false
  for (let r = 0; r < rect.h; r++) {
    for (let c = 0; c < rect.w; c++) {
      if (y + r >= state.grid.length) return false
      if (state.grid[y + r][x + c] !== 0) return false
    }
  }
  return true
}

export function place(state: PackingState, rect: Rect, x: number, y: number): PackingState {
  if (!canPlace(state, rect, x, y)) return state
  const grid = state.grid.map(r => r.slice())
  for (let r = 0; r < rect.h; r++) {
    for (let c = 0; c < rect.w; c++) {
      grid[y + r][x + c] = rect.id
    }
  }
  const placed = new Map(state.placed)
  placed.set(rect.id, { x, y })
  return { ...state, placed, grid, moves: state.moves + 1 }
}

export function unplace(state: PackingState, rectId: number): PackingState {
  const pos = state.placed.get(rectId)
  if (!pos) return state
  const grid = state.grid.map(r => r.slice())
  // Find the rect's bounds to know what to clear
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < state.width; c++) {
      if (grid[r][c] === rectId) grid[r][c] = 0
    }
  }
  const placed = new Map(state.placed)
  placed.delete(rectId)
  return { ...state, placed, grid, moves: state.moves + 1 }
}

export function currentHeight(state: PackingState): number {
  for (let r = state.grid.length - 1; r >= 0; r--) {
    for (let c = 0; c < state.width; c++) {
      if (state.grid[r][c] !== 0) return r + 1
    }
  }
  return 0
}

export function isSolved(state: PackingState, pieces?: Rect[]): boolean {
  if (!pieces) {
    // Heuristic: solved when at least 1 piece placed and no empty rows below
    if (state.placed.size === 0) return false
    let topmost = state.grid.length
    for (let r = 0; r < state.grid.length; r++) {
      for (let c = 0; c < state.width; c++) {
        if (state.grid[r][c] !== 0) { topmost = r; break }
      }
      if (topmost < state.grid.length) break
    }
    return topmost < state.grid.length
  }
  return pieces.every(p => state.placed.has(p.id))
}

export function isLoss(_state: PackingState): boolean {
  return false
}