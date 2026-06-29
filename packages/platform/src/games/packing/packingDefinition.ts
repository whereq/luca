// Packing - GameDefinition for the engine.

import type { GameDefinition, GameStats, GameTransition } from "@luca-game/engine"
import { type PackingState, newPuzzle, isSolved, isLoss } from "./packing"
import { getGame } from "../../registry"

export type PackingAction = { type: "RESTART" }
export interface PackingStats extends GameStats { moves: number }

export function initialPK(): PackingState { return newPuzzle() }
export function applyPKAction(state: PackingState, action: PackingAction): GameTransition<PackingState, PackingStats> {
  if (action.type === "RESTART") return { state: newPuzzle(), consumed: true }
  return { state }
}

export const packingDefinition: GameDefinition<PackingState, PackingAction, PackingStats> = {
  meta: getGame("packing")!,
  initialState: initialPK,
  applyAction: applyPKAction,
  isWin: isSolved,
  isLoss: () => false,
  controls: { keyboard: { r: { type: "RESTART" }, R: { type: "RESTART" } }, touch: "tap" },
  help: { description: "Pack rectangles into the container.", controls: [{ action: "Click to select, then place" }], goal: "Fit all pieces." },
  stat: { label: "games.packing.placed", compute: (s) => s.placed.size },
  render: () => null as any,
}
