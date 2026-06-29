// Hackenbush - GameDefinition for the engine.

import type { GameDefinition, GameStats, GameTransition } from "@luca-game/engine"
import { type HackenbushState, newGame, applyMove, isSolved, isLoss, isGameOver } from "./hackenbush"
import { getGame } from "../../registry"

export type HackenbushAction = { type: "CUT"; payload: { edge: number } } | { type: "RESTART" }
export interface HackenbushStats extends GameStats { moves: number }

export function initialHB(): HackenbushState { return newGame() }
export function applyHBAction(state: HackenbushState, action: HackenbushAction): GameTransition<HackenbushState, HackenbushStats> {
  switch (action.type) {
    case "CUT": return { state: applyMove(state, action.payload.edge), stats: { moves: 1 } }
    case "RESTART": return { state: newGame(), consumed: true }
  }
}

export const hackenbushDefinition: GameDefinition<HackenbushState, HackenbushAction, HackenbushStats> = {
  meta: getGame("hackenbush")!,
  initialState: initialHB,
  applyAction: applyHBAction,
  isWin: isSolved,
  isLoss,
  controls: { keyboard: { r: { type: "RESTART" }, R: { type: "RESTART" } }, touch: "tap" },
  help: { description: "Cut edges. Disconnected pieces fall. The player who can't move loses.", controls: [{ action: "Click an edge to cut it" }], goal: "Be the last player to move." },
  stat: { label: "games.hackenbush.moves", compute: (s) => s.moves },
  render: () => null as any,
}
