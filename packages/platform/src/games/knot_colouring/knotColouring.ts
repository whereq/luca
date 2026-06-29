// Knot Colouring — pure game logic (simplified).
//
// Color a knot diagram with K colors such that no two adjacent
// crossings have the same color. This is a graph coloring problem.
//
// Educational version: a small knot diagram (3-4 crossings).
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type Edge = { from: number; to: number }
export type KnotColoringState = {
  /** Number of crossings (vertices). */
  crossings: number
  /** Edges (which crossings are linked). */
  edges: Edge[]
  /** Current coloring. -1 = uncolored, else 0..K-1. */
  coloring: number[]
  numColors: number
  moves: number
}

export function newGame(numColors: number = 3, seed: number = 0): KnotColoringState {
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  // 4 crossings in a loop
  const crossings = 4
  const edges: Edge[] = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 0 },
  ]
  return {
    crossings,
    edges,
    coloring: new Array(crossings).fill(-1),
    numColors,
    moves: 0,
  }
}

export function setColor(state: KnotColoringState, idx: number, color: number): KnotColoringState {
  if (idx < 0 || idx >= state.crossings) return state
  if (color < -1 || color >= state.numColors) return state
  const coloring = state.coloring.slice()
  coloring[idx] = color
  return { ...state, coloring, moves: state.moves + 1 }
}

export function isSolved(state: KnotColoringState): boolean {
  for (let i = 0; i < state.crossings; i++) {
    if (state.coloring[i] === -1) return false
  }
  // Check no two adjacent crossings have the same color
  for (const e of state.edges) {
    if (state.coloring[e.from] === state.coloring[e.to]) return false
  }
  return true
}

export function isLoss(_state: KnotColoringState): boolean {
  return false
}

export function newPuzzle(): KnotColoringState {
  return newGame()
}