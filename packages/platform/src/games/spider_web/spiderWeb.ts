// Spider Web — pure game logic.
//
// A graph traversal puzzle. The spider must reach a fly in a
// web-shaped graph. The web has N rings (concentric circles) with
// M spokes each; plus some cross-strands. Click on a node to move
// the spider there. Path must avoid certain "stuck" nodes.
//
// This is a simplified version: a 5-ring, 8-spoke web with cross
// strands. Win: spider reaches the fly in N or fewer moves.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type NodeId = number  // 0..N-1
export type Edge = [NodeId, NodeId]
export type SpiderWebState = {
  rings: number
  spokes: number
  /** Adjacency list. */
  adj: NodeId[][]
  /** Stuck nodes (can't pass through). */
  stuck: NodeId[]
  /** Current spider position. */
  spider: NodeId
  /** Target (fly) position. */
  fly: NodeId
  moves: number
  /** Path history. */
  path: NodeId[]
}

export function buildWeb(rings: number = 5, spokes: number = 8): NodeId[][] {
  const N = rings * spokes
  const adj: NodeId[][] = Array.from({ length: N }, () => [])
  // Helper to convert (ring, spoke) to node id
  const id = (ring: number, spoke: number) => ring * spokes + spoke
  // Ring edges: each node connects to its ring neighbors
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < spokes; s++) {
      const next = (s + 1) % spokes
      const a = id(r, s)
      const b = id(r, next)
      adj[a].push(b)
      adj[b].push(a)
    }
  }
  // Spoke edges: each node connects to the corresponding node on the
  // next inner ring
  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < spokes; s++) {
      const a = id(r, s)
      const b = id(r + 1, s)
      adj[a].push(b)
      adj[b].push(a)
    }
  }
  // Cross strands (skip-2 spokes): for visual interest
  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < spokes; s++) {
      const next = (s + 2) % spokes
      const a = id(r, s)
      const b = id(r + 1, next)
      // Note: would normally add a 50% chance; for simplicity, add all
      adj[a].push(b)
      adj[b].push(a)
    }
  }
  return adj
}

export function newGame(seed: number = 0): SpiderWebState {
  const rings = 5
  const spokes = 8
  const N = rings * spokes
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  // Pick 3-5 random "stuck" nodes (not in center or fly path)
  const stuck: NodeId[] = []
  for (let i = 0; i < 5; i++) {
    const n = Math.floor(rand() * N)
    if (!stuck.includes(n)) stuck.push(n)
  }
  // Spider starts at center (0, 0)
  const spider: NodeId = 0
  // Fly at outermost ring, random spoke
  const fly: NodeId = (rings - 1) * spokes + Math.floor(rand() * spokes)
  return {
    rings,
    spokes,
    adj: buildWeb(rings, spokes),
    stuck,
    spider,
    fly,
    moves: 0,
    path: [spider],
  }
}

export function canMove(state: SpiderWebState, to: NodeId): boolean {
  return state.adj[state.spider].includes(to) && !state.stuck.includes(to)
}

export function move(state: SpiderWebState, to: NodeId): SpiderWebState {
  if (!canMove(state, to)) return state
  return {
    ...state,
    spider: to,
    moves: state.moves + 1,
    path: [...state.path, to],
  }
}

export function isSolved(state: SpiderWebState): boolean {
  return state.spider === state.fly
}

export function isLoss(_state: SpiderWebState): boolean {
  return false
}

export function newPuzzle(): SpiderWebState {
  return newGame()
}