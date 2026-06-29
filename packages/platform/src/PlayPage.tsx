import { useEffect, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGameFuzzy, getGame, PLAYABLE_GAMES } from './registry'
import ComingSoon from './ComingSoon'

/**
 * PlayPage — /games/luca/:slug
 *
 * Routes the requested game slug to its React component. The actual
 * game components live in `@luca-game/platform/games/<slug>` and
 * are statically imported below for the original 3 games (and the
 * bulk-shipped ones). For future games added to the games/ barrel,
 * they auto-route via the dynamic import fallback.
 */

// Original Session 2-3 games — eagerly imported
import Game2048 from './games/games2048/Game2048'
import LightsOut from './games/lights/LightsOut'
import Sudoku from './games/sudoku/Sudoku'

// Phase 6 — first 3 games with real UIs
import TowersOfHanoi from './games/towers_of_hanoi/TowersOfHanoi'
import SlidingBlocks from './games/sliding_blocks/SlidingBlocks'
import Tangram from './games/tangram/Tangram'
import BombDefuser from './games/bomb_defuser/BombDefuser'
import Nim from './games/nim/Nim'
import Induction from './games/induction/Induction'
import MagicSquare from './games/magic_square/MagicSquare'
import TurtleWalk from './games/turtle_walk/TurtleWalk'
import Ichomp from './games/ichomp/Ichomp'

// NOTE: The remaining 22 games in `games/<slug>/` are coming-soon.
// They have working game logic and basic tests, but their React
// components are placeholders. They will be re-exported from the
// games barrel and routed here as each UI is built.

/** Map slug → component. All currently-shipped games. */
const EAGER_GAMES: Record<string, React.ComponentType> = {
  '2048': Game2048,
  'lights': LightsOut,
  'sudoku': Sudoku,
  'towers_of_hanoi': TowersOfHanoi,
  'sliding_blocks':  SlidingBlocks,
  'tangram':         Tangram,
  'bomb_defuser':    BombDefuser,
  'nim':             Nim,
  'induction':       Induction,
  'magic_square':    MagicSquare,
  'turtle_walk':     TurtleWalk,
  'ichomp':          Ichomp,
}

export default function PlayPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const game = slug ? (getGameFuzzy(slug) ?? getGame(slug)) : undefined

  useEffect(() => {
    if (game) {
      document.title = t(
        `games.${game.slug}.name`,
        game.title,
      ) + ' — ' + t('games.luca.doc_title', 'Luca Games')
    }
  }, [game, t])

  if (!game) {
    return <ComingSoon />
  }

  if (game.status === 'coming_soon') {
    return <ComingSoon />
  }

  // Eagerly-loaded components (the original 3)
  if (EAGER_GAMES[game.slug]) {
    const Comp = EAGER_GAMES[game.slug]
    return <Comp />
  }

  // All other playable games — dynamic import from the games barrel.
  // The actual game modules are lazy and loaded on first navigation.
  return <DynamicGameLoader slug={game.slug} />
}

function DynamicGameLoader({ slug }: { slug: string }) {
  // The actual game components are imported statically above. If a
  // game is in the registry but not in the EAGER_GAMES map, we show
  // the placeholder.
  return <DynamicGame slug={slug} />
}

function DynamicGame({ slug }: { slug: string }) {
  const Comp = EAGER_GAMES[slug]
  if (!Comp) {
    return <ComingSoon />
  }
  return <Comp />
}
