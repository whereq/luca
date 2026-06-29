// Unknotting - GameDefinition for the engine.

import type { GameDefinition, GameStats, GameTransition } from "@luca-game/engine"
import { type UnknottingState, type UnknottingMove, newGame, applyMove, isSolved, isLoss } from "./unknotting"
import { getGame } from "../../registry"

export type UnknottingAction = { type: "MOVE"; payload: { move: UnknottingMove } } | { type: "RESTART" }
export interface UnknottingStats extends GameStats { moves: number }

export function initialUK(): UnknottingState { return newGame() }
export function applyUKAction(state: UnknottingState, action: UnknottingAction): GameTransition<UnknottingState, UnknottingStats> {
  switch (action.type) {
    case "MOVE": return { state: applyMove(state, action.payload.move), stats: { moves: 1 } }
    case "RESTART": return { state: newGame(), consumed: true }
  }
}

export const unknottingDefinition: GameDefinition<UnknottingState, UnknottingAction, UnknottingStats> = {
  meta: getGame("unknotting")!,
  initialState: initialUK,
  applyAction: applyUKAction,
  isWin: isSolved,
  isLoss,
  controls: { keyboard: { r: { type: "RESTART" }, R: { type: "RESTART" } }, touch: "tap" },
  help: { description: "Reduce the knot to the unknot using Reidemeister moves.", controls: [{ action: "Click a move button" }], goal: "Unknot the diagram." },
  stat: { label: "games.unknotting.crossings", compute: (s) => s.crossings },
  render: () => null as any,
}
