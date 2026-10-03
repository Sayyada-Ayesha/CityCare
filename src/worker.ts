import { onRequest, type Environment } from '../functions/api/[[path]]'

interface AssetBinding {
  fetch(request: Request): Promise<Response>
}

interface WorkerEnvironment extends Environment {
  ASSETS: AssetBinding
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

const worker = {
  async fetch(request: Request, env: WorkerEnvironment, ctx: WorkerExecutionContext): Promise<Response> {
    void ctx
    const { pathname } = new URL(request.url)

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return onRequest({ request, env })
    }

    return env.ASSETS.fetch(request)
  },
}

export default worker
