// Augments the ambient `Cloudflare.Env` interface `cloudflare:workers`'s
// `env` export is typed against, so `import { env } from "cloudflare:workers"`
// gets real binding types instead of `{}`.
//
// `wrangler types --env-interface Env` (this package's `type-gen` script)
// can generate this for you automatically, including full runtime types -
// deliberately not wired up as this file's source here, since its output
// declares its own `KVNamespace`/`D1Database`/etc. that don't structurally
// match `@cloudflare/workers-types`'s (what `@base-auth/core`'s
// `CloudflareStorage` is typed against), and this monorepo standardizes on
// `@cloudflare/workers-types` everywhere else (see `www`, `examples/tanstack-start`).
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types"

declare global {
  namespace Cloudflare {
    interface Env {
      AUTH_KV: KVNamespace
      DB: D1Database
      AVATARS: R2Bucket
    }
  }
}

export {}
