---
title: Client
description: The full @base-auth/core/client surface - authorize, exchange, verify, refresh, and getSession.
---

`@base-auth/core/client` is what any frontend - or any resource server verifying a token - uses to talk to a Base Auth issuer over plain HTTP. Nothing about it is coupled to a specific framework.

```ts
import { createClient } from "@base-auth/core/client"

const client = createClient({
  clientID: "my-app",
  issuer: "https://auth.example.com",
})
```

PKCE is always used - OAuth 2.1 makes it mandatory for every client, not just SPAs.

## authorize()

Starts the flow. Returns a URL to redirect the user to, plus a `challenge` you need later - the `verifier` inside it.

```ts
const { url, challenge } = await client.authorize(redirectURI, "code")
```

For SSR apps, store `challenge.verifier` in a short-lived httpOnly cookie across the redirect (there's no browser yet at this point to hold it in memory). For SPAs, session storage works since the redirect happens client-side.

## exchange()

Called after the user's been redirected back with a `code` query parameter. Needs the same `redirectURI` and the verifier from `authorize()`.

```ts
const exchanged = await client.exchange(code, redirectURI, challenge.verifier)
if (exchanged.err) throw new Error("Invalid code")
const { access, refresh } = exchanged.tokens
```

## verify()

Checks a token and decodes its subject. Optionally auto-refreshes if the access token has expired and you pass a refresh token.

```ts
const verified = await client.verify(subjects, access, { refresh })
if (verified.err) throw verified.err
console.log(verified.subject.properties)
if (verified.tokens) {
  // access token was refreshed - persist the new pair
}
```

A resource server (a *separate* backend receiving requests with an `Authorization: Bearer <token>` header) verifies tokens the exact same way - construct a `client` pointed at the issuer and call `.verify()`. See [Architecture](/docs/architecture) for the full third-party-integration story.

## getSession()

Sugar for `verify()` when you don't want to repeat the `subjects` schema on every call - configure it once at construction instead:

```ts
const client = createClient({ clientID, issuer, subjects })
const session = await client.getSession(access, { refresh })
```

Throws if `subjects` wasn't configured on `createClient`. Not a zero-argument, automatic-cookie-reading client the way some libraries' browser clients work - this project's access tokens live in httpOnly cookies set by the *consuming app*, specifically so client-side JS can't read them, so `token` stays an explicit argument.

## refresh()

Manually refresh an access token, without going through `verify()`.

```ts
const refreshed = await client.refresh(refreshToken)
if (!refreshed.err && refreshed.tokens) {
  const { access, refresh } = refreshed.tokens
}
```

## Verifying in-process, without a client at all

If your resource-server code happens to live in the same process as the issuer (like `examples/hono`'s `/avatar` and `/profile` routes), you don't need a `client` or an HTTP round-trip - `issuer()`'s own return value carries `auth.api.useSession({ headers })` for exactly this case. See the [issuer() reference](/docs/issuer#the-session-api).
