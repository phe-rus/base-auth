import type { ModelDefinition } from "@base-auth/core/adapter"
import type { GenerateSqliteSchemaOptions } from "./generate-sqlite-schema.js"

export interface SchemaConfig extends GenerateSqliteSchemaOptions {
  /** Only "sqlite" is implemented right now - matches `drizzleAdapter`'s `provider` option. */
  dialect: "sqlite"
  /** The merged model set to generate - usually `{ ...coreModels, ...pluginModels }`. */
  models: Record<string, ModelDefinition>
  /** Where `generate` writes the schema file. @default "./schema.ts" */
  out?: string
}

/**
 * Identity function for type inference/DX in a `schema.config.ts` a
 * developer's own project owns - same pattern as `defineConfig` in
 * `drizzle-kit`/Vite. `bunx @base-auth/adapter-drizzle generate` imports
 * this file's default export.
 */
export function defineSchemaConfig(config: SchemaConfig): SchemaConfig {
  return config
}
