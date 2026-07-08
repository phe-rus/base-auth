# Examples

- **`playground`** - the local dev loop for this repo. Runs the issuer straight off `shared/*/src` (no build step), with the Drizzle adapter and the `username`/`roles` plugins wired up. `bun run dev` from the repo root starts it on `:3005`.
- **`hono`** - the issuer, deployed as a Cloudflare Worker (KV storage, password provider). `cd examples/hono && bun run dev` (via `wrangler dev`).
- **`tanstack-start`** - a client app (TanStack Start, also Cloudflare Workers) that authenticates against an issuer using `@base-auth/core/client` - sign-in, server-side code exchange, a protected profile route. `cd examples/tanstack-start && bun run dev` on `:3001`. Points at `examples/hono`'s dev URL by default.

`www` (the marketing/docs site) runs on `:3000`. Running `bun run dev` from the repo root starts all of these together.
