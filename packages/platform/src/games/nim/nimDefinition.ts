// Nim — GameDefinition for the engine.

import type {
  GameDefinition, GameStats, GameTransition,
} from '@luca-game/engine'
import {
  type NimState, type NimMove,
  newNimGame, applyMove, isGameOver, playerWon, isValidMove,
  optimalMove,
} from './nim'
import { getGame } from '../../registry'

export type NimAction =
  | { type: 'MOVE'; payload: NimMove }
  | { type: 'RESTART' }

export interface NimStats extends GameStats {
  moves: number
  wins: number
}

export function initialNim(): NimState {
  return newNimGame()
}

export function applyNimAction(
  state: NimState,
  action: NimAction,
): GameTransition<NimState, NimStats> {
  switch (action.type) {
    case 'MOVE': {
      if (!isValidMove(state, action.payload)) {
        return { state, consumed: false }
      }
      const afterPlayer = applyMove(state, action.payload)
      // Check if game is over after player move
      if (isGameOver(afterPlayer)) {
        return { state: afterPlayer, stats: { moves: 1 } }
      }
      // AI plays a random move
      const aiMove = pickRandomMove(afterPlayer)
      if (aiMove) {
        const afterAi = applyMove(afterPlayer, aiMove)
        return { state: afterAi, stats: { moves: 1 } }
      }
      return { state: afterPlayer, stats: { moves: 1 } }
    }
    case 'RESTART':
      return { state: newNimGame(), consumed: true }
  }
}

function pickRandomMove(state: NimState): NimMove | null {
  const nonEmpty = state.piles
    .map((count, idx) => ({ idx, count }))
    .filter(p => p.count > 0)
  if (nonEmpty.length === 0) return null
  // 30% chance to play optimally; otherwise random
  if (Math.random() < 0.3) {
    const opt = optimalMove(state)
    if (opt) return opt
  }
  const pile = nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
  const count = 1 + Math.floor(Math.random() * pile.count)
  return { pile: pile.idx, count }
}

export const nimDefinition: GameDefinition<NimState, NimAction, NimStats> = {
  meta: getGame('nim')!,

  initialState: initialNim,
  applyAction: applyNimAction,
  isWin: playerWon,
  isLoss: (state) => isGameOver(state) && !playerWon(state),

  controls: {
    keyboard: {
      r: { type: 'RESTART' },
      R: { type: 'RESTART' },
    },
    touch: 'tap',
  },

  help: {
    description:
      'Three piles of stones. Each turn, remove any positive number of stones from one pile. The player who takes the last stone wins. (For two-player mode, the AI plays randomly.)',
    controls: [
      { action: 'Click a pile to select it, then click a number to take that many stones' },
      { keys: 'R', action: 'restart with new piles' },
    ],
    goal: 'Take the last stone.',
  },

  stat: {
    label: 'games.nim.stones_remaining',
    compute: (state) => state.piles.reduce((a, b) => a + b, 0),
  },

  render: () => null as any,
}