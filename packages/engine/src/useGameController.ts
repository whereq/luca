// Game engine — controller hook.
//
// The single React hook every game uses. Owns:
//   - Current game state
//   - Session stats (score, moves, elapsed)
//   - Lifecycle status (idle / playing / won / lost / paused)
//   - Persistence (via the storage adapter)
//   - Win/loss detection
//   - Restart
//
// Games call `dispatch(action)` from their render function or from
// keyboard/touch handlers. The controller handles all the boilerplate.

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  GameAction, GameDefinition, GameEvent, GameScore,
  GameStatus, GameStats, GameTransition,
} from './contracts'
import { canTransition } from './GameState'
import { defaultStorage, type GameStorage } from './GameStorage'

const initialStats = <TStats extends GameStats>(): TStats => ({
  score: 0,
  moves: 0,
  elapsed: 0,
} as TStats)

export interface GameControllerOptions<
  TState,
  TAction extends GameAction,
  TStats extends GameStats,
> {
  /** The game definition (logic, controls, help, render). */
  definition: GameDefinition<TState, TAction, TStats>
  /** Optional storage adapter override. Defaults to localStorage. */
  storage?: GameStorage
}

export interface GameController<
  TState,
  TAction extends GameAction,
  TStats extends GameStats,
> {
  /** Current game state. */
  state: TState
  /** Current lifecycle status. */
  status: GameStatus
  /** Current session stats. */
  stats: TStats
  /** Persisted score (loaded from storage on mount). */
  persistedScore: GameScore | null
  /** Whether the game is currently interactive (player can dispatch). */
  interactive: boolean
  /** Dispatch an action. The controller runs it through the game logic,
   *  updates state, status, and stats, and fires win/loss detection. */
  dispatch: (action: TAction) => void
  /** Start a new game. */
  restart: () => void
  /** Pause the game (if the game supports pause). */
  pause: () => void
  /** Resume from paused. */
  resume: () => void
  /** Toggle help overlay visibility. */
  showHelp: boolean
  setShowHelp: (v: boolean) => void
}

export function useGameController<
  TState,
  TAction extends GameAction,
  TStats extends GameStats,
>(opts: GameControllerOptions<TState, TAction, TStats>): GameController<TState, TAction, TStats> {
  const { definition, storage = defaultStorage } = opts

  const [state, setState] = useState<TState>(() => definition.initialState())
  const [stats, setStats] = useState<TStats>(() => initialStats<TStats>())
  const [status, setStatus] = useState<GameStatus>('idle')
  const [persistedScore, setPersistedScore] = useState<GameScore | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const statusRef = useRef<GameStatus>('idle')
  const persistedRef = useRef(false)  // prevent double-recording on the same game

  // Load persisted score on mount
  useEffect(() => {
    let cancelled = false
    storage.getScore(definition.meta.slug).then(score => {
      if (!cancelled) setPersistedScore(score)
    }).catch(() => {
      // ignore
    })
    return () => { cancelled = true }
  }, [storage, definition.meta.slug])

  // Update statusRef whenever status changes
  useEffect(() => { statusRef.current = status }, [status])

  // Track session start time
  const sessionStartRef = useRef<number>(Date.now())
  useEffect(() => {
    sessionStartRef.current = Date.now()
  }, [])

  const recordFinalScore = useCallback(async (finalState: TState, finalStats: TStats) => {
    if (persistedRef.current) return
    persistedRef.current = true
    // Ask the game what to record. If the game has a custom stat
    // computation, use it. Otherwise use the session score.
    const value = definition.stat
      ? Number(definition.stat.compute(finalState, finalStats))
      : finalStats.score
    try {
      const newScore = await storage.setScore(definition.meta.slug, {
        best: value,
        plays: 1,
        lastPlayedAt: new Date().toISOString(),
      })
      setPersistedScore(newScore)
    } catch {
      // ignore
    }
  }, [storage, definition, setPersistedScore])

  const dispatch = useCallback((action: TAction) => {
    // Validate lifecycle transition (start → playing on first move)
    if (statusRef.current === 'idle' && action.type !== 'PAUSE') {
      if (!canTransition('idle', 'playing')) return
      setStatus('playing')
      statusRef.current = 'playing'
    }
    if (statusRef.current !== 'playing') {
      // Allow RESTART + PAUSE/RESUME regardless
      if (action.type === 'PAUSE' || action.type === 'RESUME') {
        // fall through to logic
      } else {
        return  // can't dispatch other actions outside of playing
      }
    }

    const transition: GameTransition<TState, TStats> = definition.applyAction(state, action)
    if (transition.consumed === false) return  // illegal move, ignored

    if (transition.state !== state) {
      setState(transition.state)
    }

    // Update session stats
    if (transition.stats) {
      setStats(prev => ({ ...prev, ...transition.stats }))
    }

    // Process events
    const events: GameEvent[] = transition.events ?? []
    for (const ev of events) {
      if (ev.kind === 'WIN') {
        if (canTransition('playing', 'won')) {
          setStatus('won')
          statusRef.current = 'won'
          void recordFinalScore(transition.state, stats)
        }
      } else if (ev.kind === 'LOSS') {
        if (canTransition('playing', 'lost')) {
          setStatus('lost')
          statusRef.current = 'lost'
          void recordFinalScore(transition.state, stats)
        }
      }
      // Other event kinds (MOVE, ILLEGAL, CUSTOM) are game-specific;
      // games can subscribe via the render function if they want.
    }

    // Post-action win/loss detection (game's isWin/isLoss functions)
    if (statusRef.current === 'playing') {
      if (definition.isWin(transition.state)) {
        if (canTransition('playing', 'won')) {
          setStatus('won')
          statusRef.current = 'won'
          void recordFinalScore(transition.state, stats)
        }
      } else if (definition.isLoss?.(transition.state)) {
        if (canTransition('playing', 'lost')) {
          setStatus('lost')
          statusRef.current = 'lost'
          void recordFinalScore(transition.state, stats)
        }
      }
    }
  }, [definition, state, stats, recordFinalScore])

  const restart = useCallback(() => {
    setState(definition.initialState())
    setStats(initialStats<TStats>())
    setStatus('idle')
    setPersistedScore(p => p)  // keep current persisted
    statusRef.current = 'idle'
    persistedRef.current = false
    sessionStartRef.current = Date.now()
  }, [definition, setPersistedScore])

  const pause = useCallback(() => {
    if (definition.controls.pausable && canTransition('playing', 'paused')) {
      setStatus('paused')
    }
  }, [definition.controls.pausable])

  const resume = useCallback(() => {
    if (canTransition('paused', 'playing')) {
      setStatus('playing')
    }
  }, [])

  return {
    state,
    status,
    stats,
    persistedScore,
    interactive: status === 'playing',
    dispatch,
    restart,
    pause,
    resume,
    showHelp,
    setShowHelp,
  }
}