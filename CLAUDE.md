# Base Auth

Self-hosted OAuth 2.1 identity provider, forked from [SST's OpenAuth](https://github.com/toolbeam/openauth)
and being rebuilt into a self-hosted-first platform: a generic, ORM-agnostic
adapter layer, an opt-in plugin system (roles, username today), real user
profile fields, and examples that demonstrate running it against Cloudflare's
full local stack (D1 + KV + R2). For deeper rationale behind specific design
choices, see `.claude/decisions.md` - this file is the map, that file is the
"why."

## Stack

- **Runtime**: Bun (workspace root, `shared/*` packages, `examples/playground`,
  `examples/hono`'s tooling), Cloudflare Workers (`examples/hono` and
  `examples/tanstack-start`/`www` at runtime, via `wrangler`/`nodejs_compat`)
- **Language**: TypeScript, strict
- **HTTP**: [Hono](https://hono.dev) - the issuer is a Hono app; UI is
  server-rendered via `hono/jsx`
- **Validation**: [valibot](https://valibot.dev), via the
  [standard-schema](https://github.com/standard-schema/standard-schema) spec
  (any standard-schema-compatible library works, not just valibot)
- **DB**: [Drizzle ORM](https://orm.drizzle.team) for the one adapter that
  ships today (`@base-auth/adapter-drizzle`), targeting SQLite/D1
- **Frontend examples**: [TanStack Start](https://tanstack.com/start) + Vite
  + React + Tailwind (`examples/tanstack-start`, `www`)
- **Monorepo**: Bun workspaces + Turborepo (`turbo.json`)
- **Jose** for JWT signing/verification, **arctic** for third-party OAuth
  provider plumbing

## Monorepo structure

```
shared/
  core/               @base-auth/core - the issuer, client, adapter contract,
                       providers, storage backends, themeable UI
  adapter-drizzle/     @base-auth/adapter-drizzle - Drizzle implementation of
                       the generic Adapter interface + schema generator
  roles/               @base-auth/roles - role assignment plugin
  username/            @base-auth/username - username plugin
examples/
  hono/                Full local backend: D1 + KV + R2, idiomatic Hono,
                       avatar upload. The "how would I really run this" example.
  playground/          Fast-iteration example: bun:sqlite, runs straight off
                       shared/core/src (no build step), every plugin enabled.
  tanstack-start/      Client app consuming examples/hono as its issuer -
                       PKCE flow, httpOnly cookies, profile page.
www/                  Docs site (TanStack Start + Vite)
```

Package naming: everything under `shared/` is `@base-auth/<name>` and
publishable (see `.changeset/config.json`); everything under `examples/` is
`@base-auth/example-<name>`, `private: true`, never published.

## Core architecture

- **`issuer({ subjects, storage, providers, adapter?, plugins?, success })`**
  (`shared/core/src/issuer.ts`) builds and returns a Hono app implementing
  the full OAuth 2.1 authorization-code + PKCE flow, `/token`, `/userinfo`,
  `/.well-known/*`. `adapter` and `plugins` are optional - an issuer can run
  with zero persistence beyond the `storage` backend (see `examples/hono`
  before Phase 4, or think of it as "issuer-only, no user database").

- **`Adapter`** (`shared/core/src/adapter/adapter.ts`) is the generic,
  ORM-agnostic contract (`create`/`findOne`/`findMany`/`update`/`delete`/`count`)
  every storage backend implements. Core has no idea Drizzle exists - it's
  just the one implementation that ships. `coreModels` declares the `user`/`account`
  tables' shape declaratively (`ModelDefinition`/`FieldDefinition`), so a
  generator (`generateSqliteSchema`) can turn them into real tables in
  whichever app owns the schema.

- **Plugins** (`shared/core/src/plugin/index.ts`) mount their own routes the
  same way providers do, but don't participate in OAuth provider selection -
  they're for capabilities like role assignment or usernames that sit
  alongside authentication. A plugin declares `models` for any tables it
  needs; it receives the shared `adapter` through `ctx`, it doesn't open its
  own DB connection.

- **Identity resolution** (`shared/core/src/adapter/identity.ts`):
  `findOrCreateUserByAccount(adapter, { providerId, accountId }, profile?)`
  and `updateUserProfile(adapter, userId, profile)` are the shared,
  provider-agnostic helpers every app's own `success()` callback calls -
  this is intentionally *not* built into `issuer()` itself, since user
  lookup/creation is exactly the part OpenAuth (and this fork) leaves to the
  app.

- **Providers** (`shared/core/src/provider/*.ts`): `PasswordProvider` (with
  `PasswordUI` for the default themeable screens) plus a long list of OAuth2/OIDC
  providers (GitHub, Google, Discord, Slack, Microsoft, etc., all built on
  `arctic`). `PasswordConfig.verify` makes email verification optional;
  `sendCode`/`sendResetCode` take `{ email, code, url }` and are separate
  callbacks (the latter falls back to the former).

- **Storage** (`shared/core/src/storage/*.ts`): pluggable backends for
  OAuth protocol state (codes, refresh tokens) - `MemoryStorage`,
  `CloudflareStorage` (KV), `DynamoStorage`, `AwsStorage`. This is separate
  from the `Adapter`/user-data layer - storage is ephemeral protocol state,
  the adapter is durable identity.

- **Client** (`shared/core/src/client.ts`): `createClient({ clientID, issuer })`
  for anything consuming a Base Auth issuer - `authorize()`, `exchange()`,
  `verify()`, `refresh()`. PKCE is unconditional (OAuth 2.1).

## OAuth 2.1 compliance

- No implicit grant - `response_type` must be `code`.
- PKCE (`S256` only) is mandatory for every client, not opt-in.
- `response_types_supported: ["code"]`, `code_challenge_methods_supported: ["S256"]`
  in the discovery document.

Do not reintroduce `response_type=token`, an optional-PKCE path, or a
`plain` `code_challenge_method` - these were deliberately removed, not
oversights. See `.claude/decisions.md` for the reasoning.

## Conventions

- **No comments unless the *why* is non-obvious.** This codebase leans
  heavily on comments that explain a deliberate tradeoff or a constraint
  that isn't visible from the code itself (see almost any file touched in
  Phase 3/4) - not what the code does.
- **Tests use a `FakeAdapter`** (`shared/core/test/fake-adapter.ts`, in-memory,
  implements the real `Adapter` interface) to prove core logic is genuinely
  ORM-agnostic, without pulling in Drizzle. `shared/roles`/`shared/username`'s
  tests use a real in-memory SQLite `drizzleAdapter` instead, since they're
  testing plugin-to-adapter wiring specifically.
- **`workspace:*` for all internal cross-package dependencies.** Run `bun install`
  at the repo root after adding a new one.
- **Package exports are explicit per-entrypoint** (`@base-auth/core/adapter`,
  `/client`, `/provider/password`, `/ui/password`, `/storage/cloudflare`,
  etc.) with a `bun` condition pointing straight at `src/` for fast local
  iteration, and `dist/esm` for everything else. Only `@base-auth/core` has
  a build step (`bun run script/build.ts`); the plugin/adapter packages ship
  `src/` directly.

## Development workflow

```bash
bun install              # from repo root, after any new workspace dependency
bun run dev               # turbo: all examples + www concurrently
bun run build              # @base-auth/core only (bun run script/build.ts)
bun run test                # @base-auth/core only (bun test)

# per-package, when iterating on one thing:
cd shared/core && bun test
cd shared/roles && bun test
cd examples/hono && bun run dev        # wrangler dev, port 8787
cd examples/tanstack-start && bun run dev   # vite dev, port 3001
cd examples/playground && bun run dev  # bun --watch issuer.ts, port 3005
cd www && bun run dev                  # vite dev, port 3000
```

Typecheck any individual package with `bun x tsc --noEmit` inside it - there's
no root-level typecheck script; each package's `tsconfig.json` scopes
independently (and `shared/core`'s only includes `src/`, not `test/` - see
gotchas below).

### `examples/hono`'s D1 workflow

D1/KV/R2 all run through `wrangler dev`'s local simulation - nothing here
talks to real Cloudflare infrastructure.

```bash
cd examples/hono
bun run dev            # first run: creates the local D1/KV/R2 state under .wrangler/
                        # (the D1 .sqlite file itself is created lazily, on first
                        # real query - a plain register attempt is enough)
bun run local           # db:gen (drizzle-kit generate) + db:local (wrangler d1
                        # migrations apply --local) - run after any schema.ts change
bun run dev             # restart to pick up the new tables
```

`bun run type-gen` (`wrangler types --env-interface Env`) is available but
its output isn't wired into `tsconfig.json` - see `.claude/decisions.md` for
why (`@cloudflare/workers-types` conflict).

### Committing

Only commit when explicitly asked. Prefer small, scoped commits with a
message explaining *why*, not *what* (the diff already shows what). Always
run the relevant package's tests/typecheck before considering a change done -
this project has a strong bias toward live-verifying flows (register, login,
PKCE rejection, avatar upload) with real `curl`/`wrangler dev` runs, not just
trusting a green typecheck.

## Known gotchas

- `shared/core/tsconfig.json` doesn't include `test/` - stale test code can
  silently pass typecheck and only fail at `bun test` runtime. Check tests
  by hand when changing a public API signature.
- `bun run dev` occasionally hits a Vite inspector-port race between `www`
  and `examples/tanstack-start`'s dev servers (`EADDRINUSE`, cascades into
  turbo killing every task). Not an app bug - just retry.
- valibot's `object()` silently strips undeclared keys - if a `subjects`
  schema (issuer-side or client-side) doesn't list every field the other
  side actually sends, that field vanishes with no error, not a validation
  failure.

## Roadmap

Phase 3 (OAuth 2.1, optional verification, profile fields, first-user-admin)
and Phase 4 (D1 + R2 in `examples/hono`, avatar upload, idiomatic Hono) are
done. Phase 5, next: redesign `www` closer to bun.com's docs structure/visual
quality, add an account-management UI (current user, logout, update profile),
and document separating the auth backend from the frontend + how third-party
apps integrate.
