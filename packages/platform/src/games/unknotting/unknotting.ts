// Unknotting — pure game logic (simplified).
//
// A knot diagram is shown. The player makes Reidemeister moves
// (twists, pokes, slides) to "unknot" it. The goal is to reduce
// the knot to the unknot (zero crossings).
//
// Educational version: simple 3-4 crossing knot, with move counting.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type UnknottingMove = 'twist' | 'poke' | 'slide' | 'unknot'
export type UnknottingState = {
  /** The number of crossings in the current diagram. */
  crossings: number
  /** The moves applied. */
  history: UnknottingMove[]
  moves: number
  /** Whether the player has declared it unknotted. */
  declaredUnknotted: boolean
}

export function newGame(startCrossings: number = 4): UnknottingState {
  return {
    crossings: startCrossings,
    history: [],
    moves: 0,
    declaredUnknotted: false,
  }
}

export function applyMove(state: UnknottingState, move: UnknottingMove): UnknottingState {
  let newCrossings = state.crossings
  switch (move) {
    case 'twist':
      // Reidemeister I: adds or removes 1 crossing
      newCrossings = state.crossings + (Math.random() < 0.5 ? 1 : -1)
      break
    case 'poke':
      // Reidemeister II: adds or removes 2 crossings
      newCrossings = state.crossings + (Math.random() < 0.5 ? 2 : -2)
      break
    case 'slide':
      // Reidemeister III: doesn't change count
      break
    case 'unknot':
      return { ...state, declaredUnknotted: true, moves: state.moves + 1 }
  }
  return {
    ...state,
    crossings: Math.max(0, newCrossings),
    history: [...state.history, move],
    moves: state.moves + 1,
  }
}

export function isSolved(state: UnknottingState): boolean {
  return state.declaredUnknotted && state.crossings === 0
}

export function isLoss(_state: UnknottingState): boolean {
  return false
}

export function newPuzzle(): UnknottingState {
  return newGame()
}