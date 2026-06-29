// Dots - GameDefinition for the engine.

import type {
  GameDefinition, GameStats, GameTransition,
} from "@luca-game/engine"
import {
  type DotsState, type DotLine, newGame, applyMove, isSolved, isLoss,
  opponentMove,
} from "./dots"
import { getGame } from "../../registry"

export type DotsAction =
  | { type: "LINE"; payload: DotLine }
  | { type: "RESTART" }

export interface DotsStats extends GameStats {
  moves: number
}

export function initialDots(): DotsState {
  return newGame()
}

export function applyDotsAction(
  state: DotsState,
  action: DotsAction,
): GameTransition<DotsState, DotsStats> {
  switch (action.type) {
    case "LINE": {
      const after = applyMove(state, action.payload)
      if (after === state) return { state, consumed: false }
      // AI plays a random move
      const aiLine = opponentMove(after)
      if (aiLine) {
        const final = applyMove(after, aiLine)
        return { state: final, stats: { moves: 1 } }
      }
      return { state: after, stats: { moves: 1 } }
    }
    case "RESTART":
      return { state: newGame(), consumed: true }
  }
}

export const dotsDefinition: GameDefinition<DotsState, DotsAction, DotsStats> = {
  meta: getGame("dots")!,
  initialState: initialDots,
  applyAction: applyDotsAction,
  isWin: isSolved,
  isLoss,
  controls: { keyboard: { r: { type: "RESTART" }, R: { type: "RESTART" } }, touch: "tap" },
  help: {
    description: "Draw lines between adjacent dots. Complete a box to score and play again.",
    controls: [{ action: "Click between two adjacent dots" }],
    goal: "Score the most boxes.",
  },
  stat: { label: "games.dots.moves", compute: (state) => state.moves },
  render: () => null as any,
}
