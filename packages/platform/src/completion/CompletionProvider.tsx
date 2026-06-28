// @luca-game/platform — CompletionProvider.
//
// React context that injects a CompletionClient into the tree.
// The engine's useCompletionOnWin hook reads from this context.
//
// Usage:
//   <CompletionProvider client={httpClient}>
//     <Gallery />
//     <PlayPage />
//   </CompletionProvider>

import { createContext, useContext, type ReactNode } from 'react'
import { LocalCompletionClient } from './LocalCompletionClient'
import type { CompletionClient } from './types'

const CompletionContext = createContext<CompletionClient>(
  new LocalCompletionClient(),
)

export interface CompletionProviderProps {
  client?: CompletionClient
  children: ReactNode
}

export function CompletionProvider({
  client,
  children,
}: CompletionProviderProps) {
  return (
    <CompletionContext.Provider value={client ?? new LocalCompletionClient()}>
      {children}
    </CompletionContext.Provider>
  )
}

export function useCompletion(): CompletionClient {
  return useContext(CompletionContext)
}