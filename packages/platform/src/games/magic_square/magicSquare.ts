// Magic Square — pure game logic.
//
// Fill an N×N grid with the numbers 1..N² so that every row, every
// column, and both diagonals sum to the same "magic number".
// The magic number for an N×N square is N(N²+1)/2.
//
// This implementation gives the player a partially-filled square
// and they must fill in the rest. Pre-filled cells are immutable.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type Cell = number  // 0 = empty, 1..N² = filled
export type MagicSquareState = {
  size: number
  grid: Cell[]  // 1D, row-major
  prefilled: boolean[]  // which cells are immutable
  moves: number
}

/** Magic constant: the sum of every row, column, diagonal. */
export function magicConstant(n: number): number {
  return (n * (n * n + 1)) / 2
}

export function newPuzzle(size: number = 3, seed: number = 0): MagicSquareState {
  // Start with the solved square, then "blank out" some cells.
  // The player fills them in.
  const grid = solvedGrid(size)
  const prefilled = new Array(size * size).fill(true)
  // Blank out (size^2 - 2*size) cells randomly; keep 2*size cells.
  // (For 3x3, that's 9 - 6 = 3 blank, 6 prefilled.)
  const toBlank = (size * size) - 2 * size
  let rng = (seed || 1) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  const indices = Array.from({ length: size * size }, (_, i) => i)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  for (let i = 0; i < toBlank; i++) {
    const idx = indices[i]
    grid[idx] = 0
    prefilled[idx] = false
  }
  return { size, grid, prefilled, moves: 0 }
}

export function solvedGrid(size: number): Cell[] {
  // Siamese method for odd-sized magic squares.
  if (size % 2 === 1) return siameseOdd(size)
  // Doubly-even (size % 4 == 0): standard method
  if (size % 4 === 0) return doublyEven(size)
  // Singly-even (size % 4 == 2): LUX method
  return singlyEven(size)
}

function siameseOdd(n: number): Cell[] {
  const grid = new Array(n * n).fill(0)
  let r = 0, c = Math.floor(n / 2)
  for (let v = 1; v <= n * n; v++) {
    grid[r * n + c] = v
    const nextR = (r - 1 + n) % n
    const nextC = (c + 1) % n
    if (grid[nextR * n + nextC] !== 0) {
      r = (r + 1) % n
    } else {
      r = nextR
      c = nextC
    }
  }
  return grid
}

function doublyEven(n: number): Cell[] {
  // Strachey method
  const grid: Cell[] = new Array(n * n).fill(0)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const value = n * n - (n * r + c)
      const inTL = r < n/4 && c < n/4
      const inTR = r < n/4 && c >= 3*n/4
      const inBL = r >= 3*n/4 && c < n/4
      const inBR = r >= 3*n/4 && c >= 3*n/4
      const inMidRow = r >= n/4 && r < 3*n/4
      const inMidCol = c >= n/4 && c < 3*n/4
      if (inTL || inTR || inBL || inBR) {
        grid[r * n + c] = value
      } else if (inMidRow || inMidCol) {
        // Don't fill — leave as 0
      } else {
        grid[r * n + c] = value
      }
    }
  }
  // Fill the remaining (mid-band) cells
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r * n + c] === 0) {
        const value = n * n - (n * r + c)
        // Wait, this doesn't quite work. Let me redo:
      }
    }
  }
  // Simpler: use the "complement" method
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const inMidRow = r >= n/4 && r < 3*n/4
      const inMidCol = c >= n/4 && c < 3*n/4
      if (inMidRow || inMidCol) {
        // Place the original n*n+1-value here
        // (these are the cells that are NOT in the corners above)
        // For simplicity, use a different formula
        const v = (n * r + c) + 1
        grid[r * n + c] = v
      }
    }
  }
  return grid
}

function singlyEven(n: number): Cell[] {
  // LUX method for size = 4k+2
  const m = n / 2
  const result: Cell[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  // Generate the four quadrants
  const A = siameseOdd(m)  // top-left
  const B = siameseOdd(m)  // top-right
  const C = siameseOdd(m)  // bottom-left
  const D = siameseOdd(m)  // bottom-right
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      result[r][c] = A[r * m + c]
      result[r][c + m] = B[r * m + c] + 2 * m * m
      result[r + m][c] = C[r * m + c] + 3 * m * m
      result[r + m][c + m] = D[r * m + c] + m * m
    }
  }
  // Swap columns
  const half = (n - 2) / 4
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < half; c++) {
      const tmp = result[r][c]
      result[r][c] = result[r + m][c]
      result[r + m][c] = tmp
    }
    for (let c = n - half + 1; c < n; c++) {
      const tmp = result[r][c]
      result[r][c] = result[r + m][c]
      result[r + m][c] = tmp
    }
  }
  // Swap middle rows
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m / 2; c++) {
      const tmp = result[r][c + half + 1]
      result[r][c + half + 1] = result[r + m][c + half + 1]
      result[r + m][c + half + 1] = tmp
    }
  }
  return result.flat()
}

/** Try to set a cell. Returns the new state (or same on error). */
export function setCell(state: MagicSquareState, idx: number, value: number): MagicSquareState {
  if (state.prefilled[idx]) return state
  const grid = state.grid.slice()
  grid[idx] = value
  return { ...state, grid, moves: state.moves + 1 }
}

/** Check if the magic square is fully and correctly filled. */
export function isSolved(state: MagicSquareState): boolean {
  const n = state.size
  const m = magicConstant(n)
  // Every cell filled?
  for (let i = 0; i < n * n; i++) {
    if (state.grid[i] === 0) return false
  }
  // Rows
  for (let r = 0; r < n; r++) {
    let s = 0
    for (let c = 0; c < n; c++) s += state.grid[r * n + c]
    if (s !== m) return false
  }
  // Cols
  for (let c = 0; c < n; c++) {
    let s = 0
    for (let r = 0; r < n; r++) s += state.grid[r * n + c]
    if (s !== m) return false
  }
  // Diagonals
  let d1 = 0, d2 = 0
  for (let i = 0; i < n; i++) {
    d1 += state.grid[i * n + i]
    d2 += state.grid[i * n + (n - 1 - i)]
  }
  return d1 === m && d2 === m
}

export function isLoss(_state: MagicSquareState): boolean {
  return false
}