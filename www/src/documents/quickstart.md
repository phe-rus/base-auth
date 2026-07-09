---
title: Quickstart
description: Run the issuer and a client app together and see the whole flow in a couple minutes.
---

The fastest way to see the whole flow is the two examples in this repo: a Hono issuer with a full local backend (D1, KV, R2), and a TanStack Start client app that authenticates against it.

## 1. Run the issuer

`examples/hono` composes the issuer onto a regular `Hono` app, reading Cloudflare bindings via `cloudflare:workers` instead of a manual fetch wrapper - this is the idiomatic style, and the same app mounts other routes (like the avatar upload endpoint) alongside the issuer.

```ts
import { Hono } from "hono"
import { env } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/d1"
import { issuer } from "@base-auth/core"
import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"
import { schema } from "./schema.js"

const adapter = drizzleAdapter(drizzle(env.DB, { schema }), {
  provider: "sqlite",
  schema,
})

const auth = issuer({
  subjects,
  adapter,
  storage: CloudflareStorage({ namespace: env.AUTH_KV }),
  providers: {
    password: PasswordProvider(PasswordUI({
      verify: true,
      sendCode: async ({ email, code, url }) => console.log(email, code, url),
    })),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", { id: value.email })
    }
    throw new Error("Invalid provider")
  },
})

const app = new Hono()
app.route("/", auth)
export default app
```

```bash
cd examples/hono
bun run dev   # wrangler dev, http://localhost:8787
```

> D1/KV/R2 are all local - `wrangler dev` simulates all three, nothing here talks to real Cloudflare infrastructure. See `examples/hono/package.json`'s `local` script to generate and apply migrations, and `schema.config.ts` for how the committed `schema.ts` file is generated.

## 2. Sign in from a client

`examples/tanstack-start` uses `@base-auth/core/client` for the code flow: a loader calls `client.authorize()` to build the sign-in link, a `/callback` route calls `client.exchange()` and sets cookies, and a protected route calls `client.verify()`.

```ts
const getSignInUrl = createServerFn().handler(async () => {
  const { url, challenge } = await client.authorize(redirectUri, "code")
  setCookie("pkce_verifier", challenge.verifier!, { httpOnly: true })
  return { url }
})
```

```bash
cd examples/tanstack-start
bun run dev   # vite dev, http://localhost:3001
```

Visit `http://localhost:3001`, click sign in, register with an email/password (the verification code is logged to the issuer's terminal), and you'll land on `/profile` showing the decoded subject from the access token - plus an avatar upload that proves the whole client/issuer/resource-server round trip.

## Next

Both examples come up together with everything else if you run `bun run dev` from the repo root. See [Architecture](/docs/architecture) for how this backend/frontend split works and how a third-party app would integrate, or the [issuer() reference](/docs/issuer) for the full configuration surface.
