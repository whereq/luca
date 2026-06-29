// Calcrostic — pure game logic (simplified).
//
// A "math crossword" — a grid where you fill in digits (or numbers)
// based on arithmetic clues. Like a Kakuro puzzle but simpler.
//
// Educational version: 4x4 grid with simple addition clues.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type CalcrosticState = {
  /** The grid. 0 = empty. */
  grid: number[][]
  /** Number of rows / cols. */
  size: number
  /** Clues for each row and column (sum of that line). */
  rowClues: number[]
  colClues: number[]
  moves: number
}

export function newGame(size: number = 4, seed: number = 0): CalcrosticState {
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  // Generate a valid solution: each row is 1..size in some order
  const solution: number[][] = []
  for (let r = 0; r < size; r++) {
    const row: number[] = []
    for (let c = 0; c < size; c++) {
      row.push(1 + Math.floor(rand() * size))
    }
    // Make sure no duplicate in the row
    while (new Set(row).size < size) {
      for (let c = 0; c < size; c++) {
        row[c] = 1 + Math.floor(rand() * size)
      }
    }
    solution.push(row)
  }
  // Erase some cells (player fills in)
  const grid: number[][] = solution.map(row => row.slice())
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (rand() < 0.5) grid[r][c] = 0
    }
  }
  // Compute clues
  const rowClues: number[] = solution.map(row => row.reduce((a, b) => a + b, 0))
  const colClues: number[] = []
  for (let c = 0; c < size; c++) {
    let s = 0
    for (let r = 0; r < size; r++) s += solution[r][c]
    colClues.push(s)
  }
  return { size, grid, rowClues, colClues, moves: 0 }
}

export function setCell(state: CalcrosticState, r: number, c: number, value: number): CalcrosticState {
  if (r < 0 || r >= state.size || c < 0 || c >= state.size) return state
  if (value < 0 || value > state.size) return state
  const grid = state.grid.map(row => row.slice())
  grid[r][c] = value
  return { ...state, grid, moves: state.moves + 1 }
}

export function isSolved(state: CalcrosticState): boolean {
  // All cells filled?
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.grid[r][c] === 0) return false
    }
  }
  // No duplicates in any row or column
  for (let r = 0; r < state.size; r++) {
    const seen = new Set<number>()
    for (let c = 0; c < state.size; c++) {
      if (seen.has(state.grid[r][c])) return false
      seen.add(state.grid[r][c])
    }
  }
  for (let c = 0; c < state.size; c++) {
    const seen = new Set<number>()
    for (let r = 0; r < state.size; r++) {
      if (seen.has(state.grid[r][c])) return false
      seen.add(state.grid[r][c])
    }
  }
  // Row sums match
  for (let r = 0; r < state.size; r++) {
    const sum = state.grid[r].reduce((a, b) => a + b, 0)
    if (sum !== state.rowClues[r]) return false
  }
  // Col sums match
  for (let c = 0; c < state.size; c++) {
    let sum = 0
    for (let r = 0; r < state.size; r++) sum += state.grid[r][c]
    if (sum !== state.colClues[c]) return false
  }
  return true
}

export function isLoss(_state: CalcrosticState): boolean {
  return false
}

export function newPuzzle(): CalcrosticState {
  return newGame()
}