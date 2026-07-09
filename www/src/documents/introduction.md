---
title: Introduction
description: What Base Auth is, how it's different from a typical auth library, and where to go next.
---

Base Auth is a standards-based auth provider for web apps, mobile apps, single page apps, APIs, or third-party clients - forked from [SST's OpenAuth](https://github.com/toolbeam/openauth) and rebuilt into something you fully own: self-hosted, with roles and usernames as opt-in plugins instead of a fixed service.

- **Universal** - deploy it standalone or embed it into an existing app. Works with any framework or platform.
- **Self-hosted** - runs entirely on your infrastructure: Node, Bun, Lambda, or Cloudflare Workers.
- **OAuth 2.1** - authorization code flow with mandatory PKCE, no implicit grant. Any OAuth 2.1 client can use it.
- **Your schema, your dialect** - the adapter is a generic translator over a database you own and migrate yourself.

## Approach

Most open source auth solutions are libraries meant to be embedded into a single application. Centralized auth servers are typically delivered as SaaS - Auth0, Clerk, and similar.

Base Auth is a centralized auth server that runs on your own infrastructure, designed for self-hosting from the start. It adheres to OAuth 2.1, so anything that can speak OAuth can use it to receive access and refresh tokens - including third-party "login with your app" flows. See [Architecture](/docs/architecture) for exactly how that separation works.

It intentionally doesn't solve user management for you the way a typical framework might - once a user has identified themselves, it invokes a callback where you look up or create them. What it does provide is a generic, ORM-agnostic `Adapter` contract for durable data (users, and whatever a plugin's own models need), and a `Plugin` interface so roles and usernames can mount onto the issuer without core needing to know they exist.

## Quick example

```ts
import { issuer } from "@base-auth/core"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"

export default issuer({
  subjects,
  providers: {
    password: PasswordProvider(PasswordUI({
      sendCode: async ({ email, code, url }) => { /* email it */ },
    })),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", { id: value.email })
    }
    throw new Error("Invalid provider")
  },
})
```

## Next

- [Quickstart](/docs/quickstart) - a full walkthrough with a real client app, two examples running together.
- [Architecture](/docs/architecture) - separating the backend from the frontend, and how a third-party app integrates.
- [Providers](/docs/providers), [Adapters](/docs/adapters), [Plugins](/docs/plugins), [Client](/docs/client) - the full reference.
- [issuer() reference](/docs/issuer) - the complete configuration surface.
- [Account page](/account) - a real account page built on this project's own client library.
