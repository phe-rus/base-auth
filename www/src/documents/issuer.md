---
title: issuer()
description: The complete configuration surface for issuer() - providers, storage, adapter, plugins, subjects, and the session API.
---

Creates a Base Auth server - a [Hono](https://hono.dev) app you can deploy anywhere Hono runs: Node, Bun, Lambda, or Cloudflare Workers.

```ts
import { issuer } from "@base-auth/core"

const app = issuer({
  providers: { ... },
  subjects,
  success: async (ctx, value) => { ... },
})
```

## subjects

The shape of what the access token maps to. Define with `createSubjects` using any [standard-schema](https://standardschema.dev) library (valibot, zod, etc).

```ts
import { object, string } from "valibot"
import { createSubjects } from "@base-auth/core/subject"

const subjects = createSubjects({
  user: object({ id: string() }),
})
```

## providers

The auth providers your server supports - third-party identity providers (GitHub, Google, ...) or built-in flows (password, code). See [Providers](/docs/providers) for the full list.

```ts
import { GithubProvider } from "@base-auth/core/provider/github"
import { PasswordProvider } from "@base-auth/core/provider/password"

providers: {
  github: GithubProvider({ clientID, clientSecret, scopes: ["user:email"] }),
  password: PasswordProvider(...),
}
```

## storage

Where ephemeral OAuth protocol state lives - auth codes, refresh tokens, signing keys. A KV interface, with `MemoryStorage` for local dev, `CloudflareStorage` for KV, and `DynamoStorage` for DynamoDB.

## adapter

Where durable data lives - users, and whatever a plugin's own models need. Unlike `storage`, this isn't owned by Base Auth: you bring your own database and schema, and an adapter (like `@base-auth/adapter-drizzle`'s `drizzleAdapter`) translates a generic create/find/update/delete contract against it. Configured once, shared by every plugin. See [Adapters](/docs/adapters) for the full story, including how to generate a real, editable `schema.ts`.

```ts
import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import { db, schema } from "./db.js"

issuer({
  adapter: drizzleAdapter(db, { provider: "sqlite", schema }),
  // ...
})
```

## plugins

Opt-in capabilities that mount their own routes on the issuer - `@base-auth/username`, `@base-auth/roles`, and more to come. Each receives the shared `adapter` through context, so you never pass a database connection to a plugin yourself. See [Plugins](/docs/plugins) for how to write your own.

```ts
import { UsernamePlugin } from "@base-auth/username"
import { RolesPlugin } from "@base-auth/roles"

issuer({
  adapter,
  plugins: [UsernamePlugin(), RolesPlugin()],
  // ...
})
```

## success

Called once a provider's flow completes. Typesafe based on which providers you configured - inspect `value.provider` and return `ctx.subject(type, properties)`.

## The session API

`issuer()` still returns a real Hono app - `app.route("/", issuer({...}))` and `.fetch(request)` both work exactly as you'd expect. It also carries two small additions:

- **`auth.api.useSession({ headers })`** - resolves the current user from a bearer token in-process, no HTTP round-trip. Useful for routes mounted alongside the issuer on the same app (see `examples/hono`'s `/avatar`, `/profile`). Doesn't check the `iss` claim the way `/userinfo` does, since a bare `Headers` object has no request URL to derive the expected issuer from - everything else (signature, expiry, subject shape) is still verified.
- **`auth.handler`** - an alias for `.fetch`, for familiarity if you're coming from a library with that naming convention. Only correct when mounted at root (`app.route("/", auth)`) - the issuer computes its own base URL from the request, so mounting under a path prefix isn't supported today.

```ts
const auth = issuer({ ... })

app.route("/", auth)

app.get("/whoami", async (c) => {
  const session = await auth.api.useSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  return c.json(session)
})
```

The client side has an equivalent: `createClient({ clientID, issuer, subjects })` lets you call `client.getSession(token)` instead of repeating `client.verify(subjects, token)` on every call. See [Client](/docs/client).

## Other options

`theme` customizes the built-in UI, `ttl` controls access/refresh token lifetimes, `allow` overrides which redirect URIs are permitted, and `error` lets you render your own error page.
