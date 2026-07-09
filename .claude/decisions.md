# Architectural decisions

Non-obvious choices made while building Base Auth out from the OpenAuth fork,
with the reasoning behind them. Git history has the diffs; this has the
"why," which doesn't survive in commit messages as well as it should. Read
this before changing any of the areas below - if you're about to reintroduce
something listed here as "removed" or "rejected," there was a reason.

## Identity & data layer

- **`Adapter` is a generic, ORM-agnostic interface** (`create`/`findOne`/
  `findMany`/`update`/`delete`/`count`), defined in `shared/core/src/adapter/adapter.ts`.
  `@base-auth/core` itself has no idea Drizzle exists - `@base-auth/adapter-drizzle`
  is one implementation of the contract, not a special-cased dependency. If a
  future adapter (Prisma, Kysely, raw SQL) is needed, it only has to satisfy
  this interface, nothing in `core` changes.

- **Plugins don't own a database connection.** `issuer({ adapter, plugins })`
  configures the adapter once; every plugin receives it through `ctx` in its
  `init(route, ctx)`. A plugin that needs its own tables declares them via a
  `models: Record<string, ModelDefinition>` field (declarative, dialect-agnostic
  field descriptions), which `@base-auth/adapter-drizzle`'s `generateSqliteSchema`
  turns into real Drizzle tables in the *app's own* schema file. Neither core
  nor the plugin packages own a migration path - the app does, by committing
  its own `schema.ts` and running its own migrations. See `shared/core/src/plugin/index.ts`.

- **Identity resolution lives in core, not per-provider.** `findOrCreateUserByAccount`
  and `updateUserProfile` (`shared/core/src/adapter/identity.ts`) are the one
  place account-to-user resolution and profile updates happen, called from an
  app's own `success()` callback - not duplicated per OAuth provider. `profile`
  passed to `findOrCreateUserByAccount` only applies on creation; a repeat
  login never overwrites existing profile fields. Updating an existing user's
  profile (e.g. after an avatar upload) is a deliberately separate call
  (`updateUserProfile`), not an implicit side effect of logging in again.

- **First user ever created becomes admin, lazily.** `@base-auth/roles`'s
  `getUserRole(adapter, userId, defaultRole)` checks `adapter.count({model:"user"}) === 1`
  the first time a given user's role is looked up, and *persists* a role row
  at that point (`"admin"` if they were the first user, `defaultRole`
  otherwise). It does not re-derive on subsequent calls - it reads the
  persisted row. This was deliberately changed from an earlier version that
  returned an ephemeral, unpersisted default: without persistence, "first
  user" checks would be unstable/racy and role assignment wouldn't survive
  being looked up more than once in different ways.

## OAuth 2.1

- **PKCE is mandatory for every client, not just SPAs.** `/authorize` rejects
  a request missing `code_challenge`/`code_challenge_method`, `/token`'s PKCE
  verification is unconditional (previously gated behind a `payload.pkce`
  flag), and `code_challenge_method` must be `S256` (no `plain`). This is a
  deliberate OAuth 2.1 compliance requirement, not a preference - don't add
  an opt-out.

- **The implicit grant is gone entirely.** `response_type=token` is rejected
  with `unsupported_response_type`; `response_types_supported` in the
  discovery document is `["code"]` only. `Client.authorize()`'s `response`
  parameter is typed `"code"` (not `"code" | "token"`), and the deprecated
  `Client.pkce()` method and `AuthorizeOptions.pkce` flag were deleted - PKCE
  generation in `client.authorize()` is unconditional now, there's nothing
  left to opt into.

## Password provider

- **Email verification is optional** (`PasswordConfig.verify`, default
  `true`). When `false`, registration completes immediately after
  `action=register` instead of transitioning into the code-verification
  state - no code is generated or sent. `sendCode` becomes optional in that
  case, but is still required for the forgot-password flow regardless (that
  flow always needs to prove email ownership, independent of whether new
  registrations are verified).

- **`sendCode`/`sendResetCode` take one object param (`{ email, code, url }`),
  not positional args**, and are two separate callbacks (`sendResetCode`
  falls back to `sendCode` if not provided). This mirrors the shape of
  better-auth's `sendVerificationEmail`/`sendResetPassword` split, but
  deliberately **does not** include a `user` object the way that library's
  callback does - `PasswordProvider` has no adapter access at the point these
  fire (see "identity resolution lives in core" above), so there's no user
  row to hand over, only the email address itself. `url` links back to the
  page where the code can be entered (`/register` or `/change`), built with
  `getRelativeUrl`.

## `examples/hono` (the "full backend" example)

- **D1 + KV + R2, all local-only.** `wrangler dev` simulates all three
  regardless of whether real remote Cloudflare resources exist - the
  `database_id`/`bucket_name` in `wrangler.jsonc` are placeholders, same
  pattern the KV binding already used before D1/R2 were added. Nothing here
  talks to real Cloudflare infrastructure. `wrangler d1 migrations apply`
  needs `migrations_dir` explicitly set in the `d1_databases` binding to
  point at wherever `drizzle-kit generate` writes (`./.migrations` here) -
  wrangler's own D1 migration tracking and drizzle-kit's schema-diffing are
  two separate tools being deliberately composed, not one system.

- **Kept `@cloudflare/workers-types`, not wrangler's generated runtime
  types**, despite `wrangler types` itself suggesting the migration.
  `@base-auth/core`'s `CloudflareStorage` is typed against
  `@cloudflare/workers-types`'s `KVNamespace`; wrangler's generated
  `worker-configuration.d.ts` declares its own structurally-incompatible
  `KVNamespace`, `D1Database`, etc. Mixing the two produces real type errors
  (not just lint noise). `examples/hono/env.d.ts` hand-declares the
  `Cloudflare.Env` augmentation instead, using `@cloudflare/workers-types`
  throughout - consistent with `www` and `examples/tanstack-start`, which
  already use that package. The `type-gen` script still exists (matches the
  requested script set) but its output isn't wired into `tsconfig.json`.

- **`POST /avatar` verifies its bearer token via a self-referential
  `client.verify()` call** (`createClient({ issuer: <own origin> })`) rather
  than reading signing keys directly. This is deliberate: it's the exact
  pattern a genuinely separate resource server would use to verify a Base
  Auth access token, demonstrated on a real endpoint instead of left as a
  hypothetical - the fact that this example happens to also be the issuer is
  incidental.

- **Local D1's actual per-database `.sqlite` file doesn't exist until a real
  D1 query runs** (not just on `wrangler dev` startup - miniflare creates it
  lazily on first access). `drizzle.config.ts`'s `getLocalD1()` glob-searches
  `.wrangler/` for it; if you're setting up a fresh checkout, you need to hit
  an endpoint that actually touches the adapter (e.g. complete a full
  register+verify flow) before `bun run db:local` has a database to migrate.

## `examples/tanstack-start`

- **Avatar upload is proxied through a server function, not fetched directly
  from the browser.** The access token lives in an httpOnly cookie by
  design (XSS protection, set up earlier in the project) - client-side JS
  never has it to attach as an `Authorization` header itself. `routes/profile.tsx`'s
  `uploadAvatar` server function reads the cookie server-side and forwards
  the file to `examples/hono`'s `/avatar` with the token attached, the same
  way any trusted backend would call a resource server on the signed-in
  user's behalf.

- **The PKCE verifier also rides in a short-lived httpOnly cookie**
  (`routes/index.tsx` sets it, `routes/callback.tsx` reads and clears it),
  since an SSR app's `authorize()` call happens server-side before the
  browser exists to hold it in memory/localStorage the way an SPA would.

- **`lib/auth.ts`'s `subjects` schema must be kept in sync with whatever the
  issuer actually puts in the JWT.** valibot's `object()` silently strips
  any key not declared in the schema - this bit us once already (`email`
  quietly disappeared from the verified subject until the schema was
  updated to declare it). If `examples/hono`'s subject shape changes, this
  file has to change too, or fields will vanish with no error.

## `examples/playground`

- **Deliberately stays on `bun:sqlite`, not D1.** It's the fast-iteration
  example (runs straight off `shared/core/src` via the `bun` export
  condition, `bun --watch` reflects source edits immediately, no
  build/publish step) - adding D1 here would duplicate what `examples/hono`
  now demonstrates without adding anything. It's also the one example wired
  with every plugin (`UsernamePlugin`, `RolesPlugin`) for quick local
  testing of plugin behavior.

## Testing / tooling gotchas

- **`shared/core/tsconfig.json`'s `"include": ["src"]` means `test/` is never
  type-checked by `tsc --noEmit`.** Stale test code (wrong argument shapes,
  options that no longer exist on a type) can sit there silently until a
  test actually runs and fails at runtime. When changing a public API
  signature, grep the test directory by hand - don't trust a clean typecheck
  to mean the tests still compile against the new shape.

- **`bun run dev` (via turbo, running `www` and `examples/tanstack-start`'s
  Vite dev servers concurrently) occasionally hits a Vite inspector-port
  race** - both processes probe for a free debug port near-simultaneously,
  one loses and crashes with `EADDRINUSE`, which cascades into turbo killing
  the other tasks. This is dev-tooling flakiness, not an application bug -
  retrying the command fixes it.

- **Bun's `sideEffects: false`** (set on packages during an earlier cleanup
  pass) **breaks barrel re-exports when bundled** - if a package's `dist`
  build ever silently drops exports that work fine under `bun run script/build.ts`'s
  own dev-mode resolution, check this first.
