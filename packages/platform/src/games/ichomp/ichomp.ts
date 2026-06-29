// iChomp — pure game logic.
//
// A simplification of Chomp: an NxN grid of cells. Each turn, the
// player picks a cell, "eats" it, and all cells strictly above and
// to the right also disappear. The player forced to eat the poison
// square (top-left) loses.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type IchompState = {
  size: number
  /** 2D grid. true = still present, false = eaten. */
  grid: boolean[][]
  moves: number
  /** First cell eaten is the "poison" (top-left). Player who eats it loses. */
}

export function newGame(size: number = 4): IchompState {
  const grid: boolean[][] = []
  for (let r = 0; r < size; r++) {
    grid.push(new Array(size).fill(true))
  }
  return { size, grid, moves: 0 }
}

export function isLegal(state: IchompState, r: number, c: number): boolean {
  if (r < 0 || r >= state.size || c < 0 || c >= state.size) return false
  return state.grid[r][c]
}

export function applyMove(state: IchompState, r: number, c: number): IchompState {
  if (!isLegal(state, r, c)) return state
  const grid = state.grid.map(row => row.slice())
  for (let i = r; i < state.size; i++) {
    for (let j = c; j < state.size; j++) {
      grid[i][j] = false
    }
  }
  return { ...state, grid, moves: state.moves + 1 }
}

/** Is the game over (all cells eaten, or only poison left)? */
export function isGameOver(state: IchompState): boolean {
  return state.grid.every(row => row.every(c => !c))
}

/** The "poison" cell is (0, 0). Player who eats it loses. */
export function poisonEaten(state: IchompState): boolean {
  return !state.grid[0][0]
}

export function isWin(state: IchompState): boolean {
  return isGameOver(state) && !poisonEaten(state)
}

export function isLoss(state: IchompState): boolean {
  return poisonEaten(state)
}

export function isSolved(state: IchompState): boolean {
  return isWin(state)
}

export function newPuzzle(): IchompState {
  return newGame()
}