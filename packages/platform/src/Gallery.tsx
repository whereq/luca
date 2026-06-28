import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GAMES } from './registry'
import GameCard from './GameCard'
import { Faq } from './FAQ/Faq'
import './css/gallery.css'

type Filter = 'all' | 'playable' | 'coming_soon'

/**
 * LucaGamesPage — /games/luca
 *
 * Gallery of all 28 games in the Luca collection. Each card links to
 * /games/luca/<slug> which either mounts the playable game or shows
 * the ComingSoon placeholder.
 *
 * Filter chips at the top: All / Playable / Coming soon.
 */
export default function LucaGamesPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = GAMES
    if (filter === 'playable') {
      list = list.filter(g => g.status === 'playable')
    } else if (filter === 'coming_soon') {
      list = list.filter(g => g.status === 'coming_soon')
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(g => {
        const name = t(`games.${g.slug}.name`, g.title).toLowerCase()
        const desc = t(`games.${g.slug}.description`, g.description).toLowerCase()
        return name.includes(q) || desc.includes(q) || g.slug.includes(q)
      })
    }
    return list
  }, [filter, query, t])

  const counts = useMemo(() => {
    const playable = GAMES.filter(g => g.status === 'playable').length
    const soon = GAMES.filter(g => g.status === 'coming_soon').length
    return { playable, soon, total: GAMES.length }
  }, [])

  useEffect(() => { document.title = t('games.luca.doc_title', 'Luca Games') }, [t])

  return (
    <article className="gc-page">
      <header className="gc-hero">
        <div className="gc-hero-text">
          <h1 className="gc-title">
            {t('games.luca.title', 'Luca Games')}
          </h1>
          <p className="gc-subtitle">
            {t(
              'games.luca.subtitle',
              'A curated collection of math, logic, and strategy games — built fresh, by hand, with care.',
            )}
          </p>
        </div>
        <div className="gc-hero-stats">
          <div className="gc-stat">
            <div className="gc-stat-value">{counts.total}</div>
            <div className="gc-stat-label">{t('games.stat_total', 'Total')}</div>
          </div>
          <div className="gc-stat gc-stat-playable">
            <div className="gc-stat-value">{counts.playable}</div>
            <div className="gc-stat-label">{t('games.stat_playable', 'Playable')}</div>
          </div>
          <div className="gc-stat gc-stat-soon">
            <div className="gc-stat-value">{counts.soon}</div>
            <div className="gc-stat-label">{t('games.stat_coming', 'Coming soon')}</div>
          </div>
        </div>
      </header>

      <div className="gc-filter-bar">
        <div className="gc-filter-chips" role="tablist">
          {(['all', 'playable', 'coming_soon'] as Filter[]).map(f => {
            const isActive = filter === f
            const count = f === 'playable' ? counts.playable : f === 'coming_soon' ? counts.soon : null
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`cb-btn cb-btn-sm ${isActive ? 'cb-btn-primary' : 'cb-btn-secondary'} gc-filter-chip`}
                onClick={() => setFilter(f)}
              >
                {t(
                  `games.filter.${f}`,
                  f === 'all' ? 'All' : f === 'playable' ? 'Playable' : 'Coming soon',
                )}
                {count !== null && (
                  <span className="gc-filter-count">{count}</span>
                )}
              </button>
            )
          })}
        </div>
        <input
          type="search"
          className="gc-search"
          placeholder={t('games.search_ph', 'Search games…')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label={t('games.search_ph', 'Search games…')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="gc-empty">
          {t('games.no_match', 'No games match your search.')}
        </p>
      ) : (
        <ul className="gc-grid">
          {filtered.map(g => (
            <li key={g.slug}>
              <GameCard game={g} />
            </li>
          ))}
        </ul>
      )}

      <p className="gc-credits">
        {t('games.credits_2', 'Built with care.')}
      </p>

      <Faq
        title={t('games.luca.faq_title', 'About the games')}
        items={[
          {
            question: t(
              'games.luca.faq_why_blue_q',
              'Why are the 2048 and Sudoku tiles blue?',
            ),
            answer: t(
              'games.luca.faq_why_blue_a',
              "The tiles use the luca math color (a clean blue) instead of the original 2048 game's warm orange. Each luca subject — math, physics, chemistry — has its own color, and the games follow that pattern. 2048 and Sudoku are pure number/logic puzzles, so they use the math blue. Lights Out uses the physics purple (it's about chains of energy). The 2048 tile keeps the orange accent as a celebration of reaching the win state.",
            ),
          },
          {
            question: t(
              'games.luca.faq_dark_q',
              'I can\'t see the "2" tile in dark mode. Is this a bug?',
            ),
            answer: t(
              'games.luca.faq_dark_a',
              'No — this was fixed in v1.0.0.106. The original tiles used a warm cream color which clashed with dark mode. The current math-blue palette uses mid-tones that look correct in both themes. If you\'re seeing the old version, hard-refresh (Cmd/Ctrl+Shift+R) to clear your browser cache.',
            ),
          },
          {
            question: t(
              'games.luca.faq_engine_q',
              'Is there a game engine these run on?',
            ),
            answer: t(
              'games.luca.faq_engine_a',
              'Yes — all 3 games run on a shared GameEngine that handles the lifecycle state machine, persistence to localStorage, keyboard input, and shared UI (stats, help overlay, win/loss banners). Each game contributes its own pure logic and a render function. This means new games are ~150 lines of new code and automatically get the same chrome (help, stats, restart, win/loss handling) for free.',
            ),
          },
          {
            question: t(
              'games.luca.faq_more_q',
              'When do the other 25 games ship?',
            ),
            answer: t(
              'games.luca.faq_more_a',
              'They\'ll roll out in small batches over the coming weeks. Each one is a ~150-line game definition on top of the GameEngine, plus a themed render. The first batch will likely include Towers of Hanoi, Mastermind, and Reversi — all classics that pair well with the existing collection.',
            ),
          },
          {
            question: t(
              'games.luca.faq_scores_q',
              'Where is my best score saved?',
            ),
            answer: t(
              'games.luca.faq_scores_a',
              "In your browser's localStorage, keyed by game slug. No account is required, and the scores never leave your device. A future hosted version of luca could add an optional online leaderboard — but the local best-score tracker stays even without an account.",
            ),
          },
        ]}
      />
    </article>
  )
}