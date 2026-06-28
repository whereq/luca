import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGameFuzzy, getGame } from './registry'
import ComingSoon from './ComingSoon'
import Game2048 from './games/games2048/Game2048'
import LightsOut from './games/lights/LightsOut'
import Sudoku from './games/sudoku/Sudoku'

/**
 * PlayPage — /games/luca/:slug
 *
 * For Session 1, every game (including the 3 showcase ones) routes
 * to the ComingSoon placeholder — the actual game logic ships in
 * Sessions 2-3. When the game engine is ready, this file will branch
 * to the right `<GameComponent>` based on the slug.
 *
 * The placeholder is intentionally warm and helpful: shows the game
 * description, suggests playable alternatives.
 */
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

  // Per-game routing:
  //   2048   → Game2048 (Session 2)
  //   lights → LightsOut (Session 2)
  //   sudoku → Sudoku (Session 3)
  //   others → ComingSoon
  if (game.slug === '2048') return <Game2048 />
  if (game.slug === 'lights') return <LightsOut />
  if (game.slug === 'sudoku') return <Sudoku />
  return <ComingSoon />
}
