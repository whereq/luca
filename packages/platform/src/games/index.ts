// @luca-game/platform/games — barrel for all bundled games.
// Only games with real playable React UIs are exported here.
// Coming-soon games still have logic in their directories, but their
// UIs are placeholders — they'll be added as we build them.

export { default as games2048 } from './games2048'
export { default as lights } from './lights'
export { default as sudoku } from './sudoku'
export { default as towers_of_hanoi } from './towers_of_hanoi'
export { default as sliding_blocks } from './sliding_blocks'
export { default as tangram } from './tangram'
export { default as bomb_defuser } from './bomb_defuser'
export { default as nim } from './nim'
export { default as induction } from './induction'
export { default as magic_square } from './magic_square'
export { default as turtle_walk } from './turtle_walk'
export { default as ichomp } from './ichomp'

// In-progress (logic ready, UI placeholder):
//   See the registry.ts coming_soon entries for the remaining games.