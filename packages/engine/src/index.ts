// @luca-game/engine — public API barrel.
//
// Consumers import from this file, not from individual engine modules.
// Lets us refactor internals without breaking downstream code.

import './GameEngine.css'

export { GameEngine } from './GameEngine'
export { useGameController } from './useGameController'
export {
  GameLifecycleProvider,
  useGameLifecycle,
} from './GameLifecycle'
export type {
  GameLifecycle,
  GameCompletionInfo,
  GameLifecycleProviderProps,
} from './GameLifecycle'
export {
  defaultStorage,
  LocalStorageAdapter,
  InMemoryAdapter,
  DEFAULT_KEY_PREFIX,
} from './GameStorage'
export type { GameStorage } from './GameStorage'

export type {
  GameAction,
  GameDefinition,
  GameEvent,
  GameHelp,
  GameRenderContext,
  GameScore,
  GameStats,
  GameStatus,
  GameTransition,
  GameControls,
} from './contracts'

export {
  canTransition,
  transition as transitionStatus,
  isTerminal,
  isInteractive,
  isFinished,
  hasStarted,
  TERMINAL_STATES,
} from './GameState'

export { STATUS_TRANSITIONS } from './contracts'

export const ENGINE_VERSION = '0.1.0'
