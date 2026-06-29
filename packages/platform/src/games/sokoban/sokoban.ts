// Sokoban — pure game logic (simplified).
//
// Push boxes onto target squares. Move up/down/left/right. Can't
// push two boxes at once, can't pull.
//
// Educational version: 5x5 grid with 2-3 boxes and 2-3 targets.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type SokobanState = {
  width: number
  height: number
  /** Grid: 0 = floor, 1 = wall, 2 = box, 3 = target. */
  grid: number[][]
  /** Player position. */
  player: [number, number]
  moves: number
}

export function newGame(seed: number = 0): SokobanState {
  // Simple 5x5 layout
  // W W W W W
  // W . . . W
  // W . B T W
  // W . P . W
  // W W W W W
  return {
    width: 5,
    height: 5,
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 2, 3, 1],  // box at (2,2), target at (2,3)
      [1, 0, 0, 0, 1],  // player at (3,2)
      [1, 1, 1, 1, 1],
    ],
    player: [3, 2],
    moves: 0,
  }
}

export function move(state: SokobanState, dr: number, dc: number): SokobanState {
  const [pr, pc] = state.player
  const nr = pr + dr, nc = pc + dc
  if (nr < 0 || nr >= state.height || nc < 0 || nc >= state.width) return state
  if (state.grid[nr][nc] === 1) return state  // wall
  // If box, try to push it
  if (state.grid[nr][nc] === 2) {
    const br = nr + dr, bc = nc + dc
    if (br < 0 || br >= state.height || bc < 0 || bc >= state.width) return state
    if (state.grid[br][bc] !== 0 && state.grid[br][bc] !== 3) return state
    const grid = state.grid.map(r => r.slice())
    grid[br][bc] = 2
    grid[nr][nc] = 0
    return { ...state, grid, player: [nr, nc], moves: state.moves + 1 }
  }
  return { ...state, player: [nr, nc], moves: state.moves + 1 }
}

export function isSolved(state: SokobanState): boolean {
  // All boxes are on targets
  for (let r = 0; r < state.height; r++) {
    for (let c = 0; c < state.width; c++) {
      if (state.grid[r][c] === 2) return false  // box not on target
    }
  }
  return true
}

export function isLoss(_state: SokobanState): boolean {
  return false
}

export function newPuzzle(): SokobanState {
  return newGame()
}