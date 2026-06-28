// @luca-game/platform — HttpCompletionClient example.
//
// Reference implementation of CompletionClient that POSTs to a
// backend endpoint. Consumers copy this and adapt (auth headers,
// URL prefix, error handling, etc.) for their own backend.
//
// This is a working starting point — the contract is what matters.
// Real apps may want to add retry logic, auth headers, timeout
// handling, or batching.

import { CompletionError } from './types'
import type {
  CompletionClient,
  CompletionRequest,
  CompletionResponse,
  ResolveRequest,
  ResolveResponse,
} from './types'

export interface HttpCompletionClientOptions {
  /** Base URL of the completion API. Defaults to '/api/luca/v1'. */
  baseUrl?: string
  /** Request timeout in ms. Default 10000. */
  timeoutMs?: number
  /** Optional fetch override (for testing or custom transports). */
  fetchImpl?: typeof fetch
  /** Optional headers (e.g. for auth). */
  headers?: Record<string, string>
}

export class HttpCompletionClient implements CompletionClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch
  private readonly headers: Record<string, string>

  constructor(options: HttpCompletionClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api/luca/v1'
    this.timeoutMs = options.timeoutMs ?? 10000
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
    this.headers = options.headers ?? {}
  }

  async check<GState, GStats>(
    req: CompletionRequest<GState, GStats>,
  ): Promise<CompletionResponse> {
    return this.post<CompletionRequest<GState, GStats>, CompletionResponse>(
      '/complete',
      req,
    )
  }

  async resolve<GState, TAction>(
    req: ResolveRequest<GState>,
  ): Promise<ResolveResponse<TAction>> {
    return this.post<ResolveRequest<GState>, ResolveResponse<TAction>>(
      '/resolve',
      req,
    )
  }

  private async post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const r = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(body),
        credentials: 'include',  // include cookies for session auth
        signal: controller.signal,
      })
      if (!r.ok) {
        throw new CompletionError(
          `HTTP ${r.status} from ${path}`,
          r.status >= 500 ? 'SERVER' : 'INVALID',
          r.status,
        )
      }
      return (await r.json()) as TRes
    } catch (e) {
      if (e instanceof CompletionError) throw e
      if (e instanceof Error && e.name === 'AbortError') {
        throw new CompletionError(`Timeout after ${this.timeoutMs}ms`, 'TIMEOUT')
      }
      throw new CompletionError(
        `Network error: ${e instanceof Error ? e.message : String(e)}`,
        'NETWORK',
      )
    } finally {
      clearTimeout(timer)
    }
  }
}