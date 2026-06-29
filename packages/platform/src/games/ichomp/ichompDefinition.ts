// iChomp — GameDefinition for the engine.

import type {
  GameDefinition, GameStats, GameTransition,
} from '@luca-game/engine'
import {
  type IchompState,
  newGame, applyMove, isLegal, isSolved, isLoss,
} from './ichomp'
import { getGame } from '../../registry'

export type IchompAction =
  | { type: 'CHOMP'; payload: { r: number; c: number } }
  | { type: 'RESTART' }

export interface IchompStats extends GameStats {
  moves: number
}

export function initialIchomp(): IchompState {
  return newGame(4)
}

export function applyIchompAction(
  state: IchompState,
  action: IchompAction,
): GameTransition<IchompState, IchompStats> {
  switch (action.type) {
    case 'CHOMP': {
      if (!isLegal(state, action.payload.r, action.payload.c)) {
        return { state, consumed: false }
      }
      return { state: applyMove(state, action.payload.r, action.payload.c), stats: { moves: 1 } }
    }
    case 'RESTART':
      return { state: newGame(4), consumed: true }
  }
}

export const ichompDefinition: GameDefinition<IchompState, IchompAction, IchompStats> = {
  meta: getGame('ichomp')!,

  initialState: initialIchomp,
  applyAction: applyIchompAction,
  isWin: isSolved,
  isLoss,

  controls: {
    keyboard: { r: { type: 'RESTART' }, R: { type: 'RESTART' } },
    touch: 'tap',
  },

  help: {
    description:
      'An NxN grid of cells. Click any cell to eat it and all cells above and to the right. The top-left is poisoned — eating it loses the game. Eat everything else to win.',
    controls: [
      { action: 'Click any uneaten cell' },
      { keys: 'R', action: 'restart' },
    ],
    goal: 'Eat all non-poison cells.',
  },

  stat: {
    label: 'games.ichomp.remaining',
    compute: (state) => state.grid.flat().filter(c => c).length,
  },

  render: () => null as any,
}