// iChomp — game renderer.
//
// An NxN grid. Click a cell to "eat" it and all cells above/right of
// it. The first cell (top-left) is poisoned — eating it loses the
// game. Eat all non-poison cells to win.

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GameEngine, type GameRenderContext } from '@luca-game/engine'
import {
  type IchompState,
  newGame, isLegal, isSolved, isLoss, isGameOver,
} from './ichomp'
import type { IchompAction, IchompStats } from './ichompDefinition'
import { ichompDefinition } from './ichompDefinition'
import './ichomp.css'

function renderIchomp(
  state: IchompState,
  ctx: GameRenderContext<IchompState, IchompAction, IchompStats>,
) {
  return <IchompBoard state={state} ctx={ctx} />
}

const ichompFullDefinition = {
  ...ichompDefinition,
  render: renderIchomp,
}

const ONBOARD_KEY = 'luca:onboarded:ichomp'

export default function Ichomp() {
  return <GameEngine definition={ichompFullDefinition} className="ichomp" />
}

function IchompBoard({
  state, ctx,
}: {
  state: IchompState
  ctx: GameRenderContext<IchompState, IchompAction, IchompStats>
}) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== '1' }
    catch { return true }
  })

  useEffect(() => {
    if (state.moves > 0 && showOnboard) {
      setShowOnboard(false)
      try { window.localStorage.setItem(ONBOARD_KEY, '1') } catch {}
    }
  }, [state.moves, showOnboard])

  const isOver = isGameOver(state)
  // Don't gate on ctx.interactive — engine starts in 'idle' and
  // transitions to 'playing' on the first dispatch. We want the
  // first click to be valid.
  const interactive = !isOver

  const handleClick = (r: number, c: number) => {
    if (!interactive) return
    if (!isLegal(state, r, c)) return
    ctx.dispatch({ type: 'CHOMP', payload: { r, c } })
  }

  return (
    <div className="ich-wrap">
      {showOnboard && (
        <div className="ich-onboard" onClick={() => {
          setShowOnboard(false)
          try { window.localStorage.setItem(ONBOARD_KEY, '1') } catch {}
        }}>
          <div className="ich-onboard-inner">
            <strong>{t('games.ichomp.name', 'iChomp')}</strong>
            <p>{t('games.ichomp.onboard', 'Click a cell to eat it AND all cells above and to the right. The top-left is poisoned — eating it loses. Eat everything else to win.')}</p>
            <button>{t('common.got_it', 'Got it')}</button>
          </div>
        </div>
      )}

      <div className="ich-info">
        <span className="ich-label">{t('games.ichomp.remaining', 'Cells remaining:')}</span>
        <span className="ich-value">
          {state.grid.flat().filter(c => c).length} / {state.size * state.size - 1}
        </span>
      </div>

      <div
        className="ich-grid"
        style={{ gridTemplateColumns: `repeat(${state.size}, 1fr)` }}
      >
        {state.grid.map((row, r) =>
          row.map((present, c) => {
            const isPoison = r === 0 && c === 0
            return (
              <button
                key={`${r},${c}`}
                className={`ich-cell ${present ? 'present' : 'eaten'} ${isPoison ? 'poison' : ''} ${isOver ? 'disabled' : ''}`}
                onClick={() => handleClick(r, c)}
                disabled={!interactive || !present || isPoison}
                aria-label={`Row ${r + 1} column ${c + 1}${present ? '' : ' (eaten)'}`}
              >
                {isPoison ? '☠' : present ? '' : ''}
              </button>
            )
          })
        )}
      </div>

      {isOver && (
        <div className={`ich-result ${isSolved(state) ? 'won' : 'lost'}`}>
          <div className="ich-result-title">
            {isSolved(state)
              ? '🏆 ' + t('games.ichomp.won', 'You won!')
              : '☠ ' + t('games.ichomp.lost', 'You ate the poison!')}
          </div>
          <div className="ich-result-msg">
            {isSolved(state)
              ? t('games.ichomp.won_msg', 'All non-poison cells eaten.')
              : t('games.ichomp.lost_msg', 'Avoid the top-left!')}
          </div>
          <button onClick={ctx.restart}>{t('common.play_again', 'Play again')}</button>
        </div>
      )}
    </div>
  )
}