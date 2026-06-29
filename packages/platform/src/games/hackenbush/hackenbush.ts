// Hackenbush — pure game logic (simplified).
//
// A game on a graph of colored edges. Each turn, a player removes
// an edge and all edges no longer connected to the ground fall.
//
// Educational version: a simple 2-3 node graph with red/blue edges.
// Player who can't move loses.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type Edge = { from: number; to: number; color: 'red' | 'blue' }
export type HackenbushState = {
  nodes: number[][]
  edges: Edge[]
  /** Whose turn. */
  turn: 'red' | 'blue'
  moves: number
}

export function newGame(): HackenbushState {
  // Simple: node 0 (ground), node 1, node 2
  // Edge 0-1 red, 0-2 blue, 1-2 red
  return {
    nodes: [
      [1, 2],  // node 0 connects to 1 and 2
      [0, 2],  // node 1 connects to 0 and 2
      [0, 1],  // node 2 connects to 0 and 1
    ],
    edges: [
      { from: 0, to: 1, color: 'red' },
      { from: 0, to: 2, color: 'blue' },
      { from: 1, to: 2, color: 'red' },
    ],
    turn: 'red',
    moves: 0,
  }
}

export function isLegal(state: HackenbushState, edgeIdx: number): boolean {
  if (edgeIdx < 0 || edgeIdx >= state.edges.length) return false
  return state.edges[edgeIdx].color === state.turn
}

export function applyMove(state: HackenbushState, edgeIdx: number): HackenbushState {
  if (!isLegal(state, edgeIdx)) return state
  const edges = state.edges.filter((_, i) => i !== edgeIdx)
  // Recompute connectivity: which nodes are still connected to ground (node 0)?
  const connected = new Set<number>([0])
  let changed = true
  while (changed) {
    changed = false
    for (const e of edges) {
      if (connected.has(e.from) && !connected.has(e.to)) {
        connected.add(e.to)
        changed = true
      }
      if (connected.has(e.to) && !connected.has(e.from)) {
        connected.add(e.from)
        changed = true
      }
    }
  }
  // Drop edges connected to non-grounded nodes
  const filteredEdges = edges.filter(e => connected.has(e.from) && connected.has(e.to))
  return {
    ...state,
    edges: filteredEdges,
    turn: state.turn === 'red' ? 'blue' : 'red',
    moves: state.moves + 1,
  }
}

export function isGameOver(state: HackenbushState): boolean {
  return !state.edges.some(e => e.color === state.turn)
}

export function isSolved(state: HackenbushState): boolean {
  // The current player wins if it's the other player's turn and they
  // can't move. We model this from the perspective of "red just moved
  // and blue can't".
  if (isGameOver({ ...state, turn: 'red' })) return state.turn === 'blue'  // red wins
  if (isGameOver({ ...state, turn: 'blue' })) return state.turn === 'red'  // blue wins
  return false
}

export function isLoss(_state: HackenbushState): boolean {
  return false
}

export function newPuzzle(): HackenbushState {
  return newGame()
}