// Nim — pure game logic.
//
// The classic impartial game. N piles of stones. Each turn, remove
// any positive number of stones from exactly one pile. The player
// who takes the LAST stone wins.
//
// Misère variant: the player who takes the LAST stone LOSES.
// (Luca uses normal play — last stone wins — by default.)
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type NimMove = { pile: number; count: number }
export type NimState = {
  piles: number[]
  moves: number
  /** Whose turn it is. 'player' for the human. */
  turn: 'player'
  /** Whether the game uses misère rules. */
  misere: boolean
}

export function newNimGame(piles: number[] = [3, 5, 7], misere = false): NimState {
  return { piles: piles.slice(), moves: 0, turn: 'player', misere }
}

/** Alias used by the engine's GameDefinition. */
export const newPuzzle = newNimGame

export function isValidMove(state: NimState, move: NimMove): boolean {
  if (move.pile < 0 || move.pile >= state.piles.length) return false
  if (move.count < 1) return false
  if (move.count > state.piles[move.pile]) return false
  return true
}

export function applyMove(state: NimState, move: NimMove): NimState {
  if (!isValidMove(state, move)) return state
  const piles = state.piles.slice()
  piles[move.pile] -= move.count
  return { ...state, piles, moves: state.moves + 1 }
}

/** Game is over when all piles are empty. */
export function isGameOver(state: NimState): boolean {
  return state.piles.every(p => p === 0)
}

/** In normal play: the player who took the last stone wins.
 *  In misère: the player who took the last stone loses. */
export function playerWon(state: NimState): boolean {
  if (!isGameOver(state)) return null as any  // not over
  return !state.misere
}

/** Compute the nim-sum (xor of all pile sizes). Used to determine
 *  if the current player is in a winning position. */
export function nimSum(state: NimState): number {
  return state.piles.reduce((acc, p) => acc ^ p, 0)
}

/** True if the current player (the one about to move) can force a win.
 *  In normal Nim, player wins iff nim-sum is 0 (i.e. they're behind
 *  and can equalize).
 *  In misère Nim, the rule inverts for all-zero or all-one piles. */
export function isWinningPosition(state: NimState): boolean {
  const s = nimSum(state)
  if (state.misere) {
    // Misère: standard rule inverts unless all piles are size 1.
    const allOnes = state.piles.every(p => p === 0 || p === 1)
    if (allOnes) return s !== 0
    return s === 0
  }
  return s !== 0
}

/** No real "loss" condition in Nim — you can always move until empty. */
export function isLoss(_state: NimState): boolean {
  return false
}

/** Alias used by the engine. Nim is won when the game is over
 *  and the player who moved last took the last stone. Since we
 *  don't track whose turn it is in the engine's view, we use
 *  "the game is over and the player has at least one valid move
 *  history" as a proxy: the game is over (all piles empty) and
 *  we have made at least one move. */
export function isSolved(state: NimState): boolean {
  return isGameOver(state) && state.moves > 0
}

/** Optimal move for the current player (if winning position).
 *  Returns null if no winning move exists (i.e. we're losing). */
export function optimalMove(state: NimState): NimMove | null {
  const s = nimSum(state)
  if (s === 0) {
    // No winning move; just return any valid one
    for (let i = 0; i < state.piles.length; i++) {
      if (state.piles[i] > 0) return { pile: i, count: 1 }
    }
    return null
  }
  // Find a pile where pile XOR s < pile; take `count = pile - (pile XOR s)` stones.
  for (let i = 0; i < state.piles.length; i++) {
    const pile = state.piles[i]
    const target = pile ^ s
    if (target < pile) {
      return { pile: i, count: pile - target }
    }
  }
  return null
}