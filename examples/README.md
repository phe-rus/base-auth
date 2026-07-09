# Examples

- **`hono`** - the full backend example: an issuer deployed as a Cloudflare
  Worker, with D1 (durable identity via `@base-auth/adapter-drizzle`), KV
  (OAuth protocol state), and R2 (avatar uploads), the `username`/`roles`
  plugins wired up, and resource-server-style routes (`/avatar`, `/profile`)
  demonstrating how a separate backend would verify a Base Auth token.
  `cd examples/hono && bun run dev` (via `wrangler dev`) on `:8787`. See its
  `schema.config.ts` for how the committed `schema.ts` is generated.
- **`tanstack-start`** - a client app (TanStack Start, also Cloudflare
  Workers-targeted) that authenticates against an issuer using
  `@base-auth/core/client` - sign-in, server-side PKCE code exchange, a
  protected profile route with avatar upload. `cd examples/tanstack-start && bun run dev`
  on `:3001`. Points at `examples/hono`'s dev URL by default.

`www` (the docs site, plus a real account-management page built on the same
client library) runs on `:3000`. Running `bun run dev` from the repo root
starts all of these together.
