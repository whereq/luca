// GeomeTree — pure game logic.
//
// A branching tree puzzle. Each node has a value; the value of the
// parent equals the sum (or product) of its children. The player
// must fill in the missing values.
//
// Educational version: sum tree, 3 levels deep.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type GeomeNode = {
  /** 0 = leaf, 1+ = internal. */
  depth: number
  /** Children indices (for internal nodes). */
  children: number[]
  /** The value (pre-filled or player input). */
  value: number | null
  /** Whether this value is given (immutable). */
  prefilled: boolean
}

export type GeomeTreeState = {
  /** The tree. */
  nodes: GeomeNode[]
  /** The relationship: 'sum' or 'product'. */
  relation: 'sum' | 'product'
  moves: number
}

/** Build a balanced tree of `depth` levels. depth=0 is just a leaf. */
export function newGame(depth: number = 3, seed: number = 0, relation: 'sum' | 'product' = 'sum'): GeomeTreeState {
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  const nodes: GeomeNode[] = []
  // Generate leaves first (depth = 0)
  const leafCount = 2 ** depth
  for (let i = 0; i < leafCount; i++) {
    nodes.push({
      depth: 0,
      children: [],
      value: relation === 'sum' ? 1 + Math.floor(rand() * 9) : 2 + Math.floor(rand() * 5),
      prefilled: true,
    })
  }
  // Build internal nodes (depth 1, 2, ..., depth)
  for (let d = 1; d <= depth; d++) {
    const nodesAtPrevLevel = 2 ** (depth - d + 1)
    for (let i = 0; i < nodesAtPrevLevel / 2; i++) {
      // Children are at level depth-(d+1)+1 = depth-d
      const childBase = i * 2
      nodes.push({
        depth: d,
        children: [childBase, childBase + 1],
        value: null,  // player fills in
        prefilled: false,
      })
    }
  }
  // Compute the root (last node added, depth = depth)
  // For now, leave all internal node values null; player must figure
  // them out from the leaves.
  return { nodes, relation, moves: 0 }
}

export function setValue(state: GeomeTreeState, idx: number, value: number): GeomeTreeState {
  if (idx < 0 || idx >= state.nodes.length) return state
  if (state.nodes[idx].prefilled) return state
  const nodes = state.nodes.slice()
  nodes[idx] = { ...nodes[idx], value }
  return { ...state, nodes, moves: state.moves + 1 }
}

/** Are all internal node values filled in correctly? */
export function isSolved(state: GeomeTreeState): boolean {
  for (let i = 0; i < state.nodes.length; i++) {
    if (state.nodes[i].value === null) return false
  }
  // Recompute expected values from leaves
  for (let i = 0; i < state.nodes.length; i++) {
    const node = state.nodes[i]
    if (node.children.length === 0) continue  // leaf
    const childVals = node.children.map(c => state.nodes[c].value) as number[]
    if (childVals.some(v => v === null || v === undefined)) return false
    const expected = state.relation === 'sum'
      ? childVals.reduce((a, b) => a + b, 0)
      : childVals.reduce((a, b) => a * b, 1)
    if (node.value !== expected) return false
  }
  return true
}

export function isLoss(_state: GeomeTreeState): boolean {
  return false
}

/** Alias used by the engine's GameDefinition. */
export const newPuzzle = () => newGame()