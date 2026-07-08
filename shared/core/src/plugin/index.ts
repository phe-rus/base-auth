import type { Hono } from "hono"
import type { Adapter, ModelDefinition } from "../adapter/adapter.js"

export interface PluginContext {
  adapter: Adapter
}

/**
 * A plugin mounts its own routes on the issuer's Hono app, the same way a
 * provider does. Unlike providers, plugins don't participate in the OAuth
 * provider-selection flow - they're for capabilities like managing a
 * username or role that sit alongside authentication.
 *
 * Plugins don't take their own `db`/adapter - `issuer({ adapter, plugins })`
 * configures the adapter once, and every plugin receives it through `ctx`.
 * A plugin that needs its own tables declares them via `models`, so an
 * adapter's schema generator can turn them into real tables in the app's
 * own schema.
 */
export interface Plugin {
  name: string
  init(route: Hono, ctx: PluginContext): void
  models?: Record<string, ModelDefinition>
}
