---
title: Providers
description: The full list of built-in providers - password, pin code, generic OAuth2/OIDC, and every named third-party identity provider.
---

Providers are what `issuer({ providers })` mounts - each one owns its own routes and its own flow, and the `success` callback you configure on the issuer receives a typed `value` based on which providers you enabled.

## Password

`PasswordProvider`, almost always paired with the themeable `PasswordUI` (server-rendered, framework-agnostic - see [the hosted UI](/docs/issuer) if you want to build your own screens instead).

```ts
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"

providers: {
  password: PasswordProvider(
    PasswordUI({
      // opt-in, off by default
      verify: true,
      sendCode: async ({ email, code, url }) => { /* email it */ },
      // optional - falls back to sendCode. Different copy for reset vs. verify.
      sendResetCode: async ({ email, code, url }) => { ... },
      validatePassword: (password) => password.length < 8 ? "Too short" : undefined,
    }),
  ),
}
```

`verify` defaults to `false` - registration completes immediately unless you turn it on. `sendCode` is still required for the forgot-password flow regardless, since that always needs to prove email ownership.

## Code (pin, no password)

`CodeProvider`, paired with `CodeUI` - a one-time code is the only credential, good for magic-link-style flows. Unlike the password provider's `sendCode`, this one's `claims` argument is generic (whatever fields your `CodeUI` form collects, not fixed to `email`) - it's a *different*, unrelated `sendCode` signature, not the same callback shape.

```ts
import { CodeProvider } from "@base-auth/core/provider/code"
import { CodeUI } from "@base-auth/core/ui/code"

providers: {
  code: CodeProvider(CodeUI({
    sendCode: async (claims, code) => { /* claims.email, or whatever field you configured */ },
  })),
}
```

## Generic OAuth2 / OIDC

For an identity provider that isn't in the named list below - `Oauth2Provider` for plain OAuth 2.0, `OidcProvider` for anything speaking OpenID Connect discovery.

```ts
import { Oauth2Provider } from "@base-auth/core/provider/oauth2"

providers: {
  custom: Oauth2Provider({
    clientID: "...",
    clientSecret: "...",
    endpoint: {
      authorization: "https://auth.example.com/authorize",
      token: "https://auth.example.com/token",
    },
  }),
}
```

## Named third-party providers

All built on [arctic](https://arcticjs.dev), all taking `{ clientID, clientSecret, scopes }` at minimum: `@base-auth/core/provider/<name>`.

| Provider | Import |
| --- | --- |
| Apple | `apple` |
| AWS Cognito | `cognito` |
| Discord | `discord` |
| Facebook | `facebook` |
| GitHub | `github` |
| Google | `google` |
| JumpCloud | `jumpcloud` |
| Keycloak | `keycloak` |
| LinkedIn | `linkedin` |
| Microsoft | `microsoft` |
| Slack | `slack` |
| Spotify | `spotify` |
| Twitch | `twitch` |
| X (Twitter) | `x` |
| Yahoo | `yahoo` |

```ts
import { GithubProvider } from "@base-auth/core/provider/github"

providers: {
  github: GithubProvider({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    scopes: ["user:email"],
  }),
}
```

## Handling multiple providers in `success`

`value.provider` is a typed discriminant based on your `providers` config - narrow on it the same way regardless of how many you configure:

```ts
success: async (ctx, value) => {
  if (value.provider === "password") {
    return ctx.subject("user", { id: value.email })
  }
  if (value.provider === "github") {
    return ctx.subject("user", { id: value.tokenset.access })
  }
  throw new Error("Invalid provider")
}
```
