// KnotColouring - GameDefinition for the engine.

import type { GameDefinition, GameStats, GameTransition } from "@luca-game/engine"
import { type KnotColoringState, newGame, setColor, isSolved, isLoss } from "./knotColouring"
import { getGame } from "../../registry"

export type KnotAction = { type: "COLOR"; payload: { node: number; color: number } } | { type: "RESTART" }
export interface KnotStats extends GameStats { moves: number }

export function initialKC(): KnotColoringState { return newGame() }
export function applyKCAction(state: KnotColoringState, action: KnotAction): GameTransition<KnotColoringState, KnotStats> {
  switch (action.type) {
    case "COLOR": return { state: setColor(state, action.payload.node, action.payload.color), stats: { moves: 1 } }
    case "RESTART": return { state: newGame(), consumed: true }
  }
}

export const knotColouringDefinition: GameDefinition<KnotColoringState, KnotAction, KnotStats> = {
  meta: getGame("knot_colouring")!,
  initialState: initialKC,
  applyAction: applyKCAction,
  isWin: isSolved,
  isLoss,
  controls: { keyboard: { r: { type: "RESTART" }, R: { type: "RESTART" } }, touch: "tap" },
  help: { description: "Color each node so adjacent nodes have different colors.", controls: [{ action: "Click a node, then a color" }], goal: "Adjacent nodes differ." },
  stat: { label: "games.knot_colouring.moves", compute: (s) => s.moves },
  render: () => null as any,
}
