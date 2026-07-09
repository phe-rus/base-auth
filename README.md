# Base Auth

**Base Auth by Pherus** is a self-hosted, OAuth 2.1-compliant identity
provider - a fork of [SST's OpenAuth](https://github.com/toolbeam/openauth)
(MIT licensed) being rebuilt with a generic database adapter layer, an
opt-in plugin system, and real user profile fields, while keeping OpenAuth's
core idea: a centralized auth server that runs on your own infrastructure
and speaks standard OAuth, so any OAuth client can use it.

- **Self-hosted**: runs entirely on your own infrastructure - Node.js, Bun,
  or Cloudflare Workers. No SaaS dependency.
- **Standards-based**: implements OAuth 2.1 - authorization code flow with
  mandatory PKCE (`S256`), no implicit grant. Any OAuth 2.1 client can use it.
- **Database-agnostic**: a generic `Adapter` interface, not a hardcoded ORM.
  A Drizzle implementation ships today (`@base-auth/adapter-drizzle`);
  anything satisfying the interface works.
- **Pluggable**: an opt-in plugin system (`@base-auth/roles`, `@base-auth/username`
  today) for capabilities that sit alongside authentication without being
  baked into core.
- **Customizable UI**: prebuilt, themeable screens (built on `hono/jsx`) for
  password auth, or opt out and implement your own.
- **User profiles, without prescribing a data model**: optional
  `email`/`preferredName`/`avatar` fields, first-user-is-admin, optional
  email verification - all opt-in, none of it forces a schema on you beyond
  what you enable.

## Quick start

```bash
git clone <this-repo>
cd base-auth
bun install
bun run dev
```

This starts every example and the docs site concurrently via Turborepo:

| App | Port | What it is |
| --- | --- | --- |
| `examples/hono` | `8787` | Full local backend - D1 + KV + R2 via `wrangler dev`, idiomatic Hono, avatar uploads |
| `examples/playground` | `3005` | Fast-iteration example - `bun:sqlite`, every plugin enabled, no build step |
| `examples/tanstack-start` | `3001` | Client app - signs in against `examples/hono`, PKCE + httpOnly cookies |
| `www` | `3000` | Docs site |

Pick whichever example matches how you want to run this and read its source
- they're meant to be copied from, not just run.

## Project structure

```
shared/
  core/               @base-auth/core - issuer, client, adapter contract,
                       providers, storage backends, themeable UI
  adapter-drizzle/     @base-auth/adapter-drizzle - Drizzle implementation of
                       the Adapter interface + a schema generator
  roles/               @base-auth/roles - role assignment plugin
  username/            @base-auth/username - username plugin
examples/
  hono/                D1 + KV + R2 via wrangler, idiomatic Hono composition
  playground/          bun:sqlite, hot-reloadable, every plugin enabled
  tanstack-start/       Client consuming examples/hono - PKCE, avatar upload UI
www/                  Docs site (TanStack Start + Vite)
```

Everything in `shared/` is published as `@base-auth/<name>`; everything in
`examples/` is private and exists to be read, not installed.

## Core concepts

### The issuer

```ts
import { issuer } from "@base-auth/core"

const app = issuer({
  subjects,
  storage,
  providers: { ... },
  adapter,   // optional - omit for a stateless, DB-less issuer
  plugins: [ ... ],  // optional
  success: async (ctx, value) => { ... },
})
```

`issuer` returns a [Hono](https://hono.dev) app implementing the full OAuth
2.1 authorization-code + PKCE flow, `/token`, `/userinfo`, and
`/.well-known/*` discovery endpoints. Deploy it anywhere Hono runs:

```ts
// Bun / Cloudflare Workers
export default app

// Cloudflare Workers, idiomatic style (see examples/hono)
import { env } from "cloudflare:workers"
const app = new Hono()
app.route("/", issuer({ ... }))
export default app

// Node.js
import { serve } from "@hono/node-server"
serve(app)

// AWS Lambda
import { handle } from "hono/aws-lambda"
export const handler = handle(app)
```

### Providers

Built-in `PasswordProvider` (paired with the themeable `PasswordUI`), plus a
long list of third-party OAuth2/OIDC providers (GitHub, Google, Discord,
Slack, Microsoft, and more), all under `@base-auth/core/provider/*`.

```ts
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"

const app = issuer({
  providers: {
    password: PasswordProvider(
      PasswordUI({
        // optional - defaults to true. false skips email verification
        // entirely and completes registration immediately.
        verify: true,
        sendCode: async ({ email, code, url }) => {
          // send an email with the code (and optionally a link to `url`)
        },
        // optional - falls back to sendCode if omitted. Lets you send
        // different copy for "verify your account" vs "reset your password".
        sendResetCode: async ({ email, code, url }) => { ... },
      }),
    ),
  },
  // ...
})
```

### Subjects

What the access token (a signed JWT) resolves to. Validated with any
[standard-schema](https://github.com/standard-schema/standard-schema)-compatible
library - [valibot](https://valibot.dev) is what the examples use.

```ts
import { object, optional, string } from "valibot"
import { createSubjects } from "@base-auth/core/subject"

const subjects = createSubjects({
  user: object({
    id: string(),
    email: optional(string()),
    role: string(),
  }),
})
```

### The adapter & identity resolution

`Adapter` is a generic, ORM-agnostic interface - core has no idea Drizzle
exists. `@base-auth/adapter-drizzle` is the implementation that ships today.

```ts
import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import {
  findOrCreateUserByAccount,
  updateUserProfile,
} from "@base-auth/core/adapter"

const adapter = drizzleAdapter(db, { provider: "sqlite", schema })

const app = issuer({
  adapter,
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const user = await findOrCreateUserByAccount(
        adapter,
        { providerId: "password", accountId: value.email },
        { email: value.email }, // only applied on first creation
      )
      return ctx.subject("user", { id: user.id, email: user.email })
    }
    throw new Error("Invalid provider")
  },
})
```

`updateUserProfile(adapter, userId, { avatar: url })` updates an *existing*
user - see `examples/hono`'s `/avatar` upload endpoint for a full example.

### Plugins

Opt-in capabilities that sit alongside authentication - they mount their own
routes and can declare their own tables, without owning a DB connection
(they receive the shared `adapter` through `ctx`).

```ts
import { RolesPlugin, getUserRole } from "@base-auth/roles"
import { UsernamePlugin } from "@base-auth/username"

const app = issuer({
  adapter,
  plugins: [RolesPlugin(), UsernamePlugin()],
  success: async (ctx, value) => {
    const user = await findOrCreateUserByAccount(adapter, { ... })
    const role = await getUserRole(adapter, user.id) // first user ever -> "admin"
    return ctx.subject("user", { id: user.id, role })
  },
})
```

To wire a plugin's tables into your own schema (needed for any real
database, not the ephemeral test adapters):

```ts
import { generateSqliteSchema } from "@base-auth/adapter-drizzle"
import { coreModels } from "@base-auth/core/adapter"
import { roleModels } from "@base-auth/roles"
import { usernameModels } from "@base-auth/username"

export const schema = generateSqliteSchema({
  ...coreModels,
  ...roleModels,
  ...usernameModels,
})
```

Then run your ORM's normal migration workflow against `schema.ts` - see
`examples/hono` (D1) or `examples/playground` (`bun:sqlite`) for the full
setup, including `drizzle-kit`/`wrangler d1 migrations` wiring.

### The client

```ts
import { createClient } from "@base-auth/core/client"

const client = createClient({
  clientID: "my-app",
  issuer: "https://auth.example.com",
})
```

PKCE is always used - OAuth 2.1 makes it mandatory for every client, not
just SPAs.

```ts
// Start the flow - `challenge.verifier` needs to survive the redirect
// (httpOnly cookie for SSR apps, sessionStorage for SPAs).
const { url, challenge } = await client.authorize(redirectURI, "code")

// After the redirect back, exchange the code
const exchanged = await client.exchange(code, redirectURI, challenge.verifier)
if (exchanged.err) throw new Error("Invalid code")
const { access, refresh } = exchanged.tokens

// Verify a token (optionally auto-refreshing if it's expired)
const verified = await client.verify(subjects, access, { refresh })
if (verified.err) throw verified.err
console.log(verified.subject.properties)
```

A resource server (a *separate* backend receiving requests with a
`Authorization: Bearer <token>` header) verifies tokens the exact same way -
construct a `client` pointed at the issuer and call `.verify()`. See
`examples/hono`'s `/avatar` upload endpoint for a real example of this
pattern in a genuinely different role than "the issuer."

## Development

```bash
bun install       # after pulling, or after adding any workspace dependency
bun run dev        # all examples + www, via turbo
bun run build        # @base-auth/core only
bun run test           # @base-auth/core only
```

Per-package, when iterating on one thing:

```bash
cd shared/core && bun test
cd shared/roles && bun test
cd examples/hono && bun run dev             # wrangler dev
cd examples/tanstack-start && bun run dev    # vite dev
```

`examples/hono`'s D1 database is local-only, via `wrangler dev`'s
simulation:

```bash
cd examples/hono
bun run dev      # first run creates the local D1/KV/R2 state
bun run local     # drizzle-kit generate + wrangler d1 migrations apply --local
```

See `CLAUDE.md` for the fuller architecture/conventions reference, and
`.claude/decisions.md` for the reasoning behind specific non-obvious choices
(OAuth 2.1 changes, the adapter/plugin split, why certain things are wired
the way they are).

## License

MIT, forked from [SST's OpenAuth](https://github.com/toolbeam/openauth).
