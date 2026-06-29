// Fruit Salad — pure game logic.
//
// A logic puzzle. Each fruit appears a fixed number of times across
// several fruit bowls. The player must figure out the distribution.
//
// Simplified for the educational version: 3 fruits, 3 bowls, each
// bowl has all 3 fruits, each fruit appears exactly once per bowl.
//
// All exports are PURE FUNCTIONS. No React, no DOM.

export type Fruit = 'apple' | 'banana' | 'cherry' | 'date' | 'elderberry'
export const FRUITS: Fruit[] = ['apple', 'banana', 'cherry', 'date', 'elderberry']

export type FruitSaladState = {
  /** The hidden assignment: for each bowl, what's the count of each fruit. */
  bowls: number[][]  // bowls[b][f] = count of fruit f in bowl b
  /** The player's current guess. */
  guess: number[][]
  moves: number
}

export function newGame(numBowls: number = 3, fruitCount: number = 3, seed: number = 0): FruitSaladState {
  let rng = (seed || Date.now()) | 0
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }
  const fruits = FRUITS.slice(0, fruitCount)
  const bowls: number[][] = []
  for (let b = 0; b < numBowls; b++) {
    const counts = new Array(fruitCount).fill(0)
    let remaining = fruitCount
    for (let f = 0; f < fruitCount; f++) {
      counts[f] = Math.floor(rand() * (remaining + 1))
      remaining -= counts[f]
    }
    bowls.push(counts)
  }
  return {
    bowls,
    guess: Array.from({ length: numBowls }, () => new Array(fruitCount).fill(0)),
    moves: 0,
  }
}

export function setGuess(state: FruitSaladState, bowl: number, fruit: number, count: number): FruitSaladState {
  if (bowl < 0 || bowl >= state.bowls.length) return state
  if (fruit < 0 || fruit >= state.bowls[bowl].length) return state
  if (count < 0) return state
  const guess = state.guess.map(row => row.slice())
  guess[bowl][fruit] = count
  return { ...state, guess, moves: state.moves + 1 }
}

export function isSolved(state: FruitSaladState): boolean {
  for (let b = 0; b < state.bowls.length; b++) {
    for (let f = 0; f < state.bowls[b].length; f++) {
      if (state.guess[b][f] !== state.bowls[b][f]) return false
    }
  }
  return true
}

export function isLoss(_state: FruitSaladState): boolean {
  return false
}

export function newPuzzle(): FruitSaladState {
  return newGame()
}