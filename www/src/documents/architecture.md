---
title: Architecture
description: Separating the auth backend from the frontend, and how a third-party app integrates.
---

Base Auth is meant to run as its own deployable unit - a separate service your frontends (however many of them, however different their stacks are) all talk to over HTTP, not a library one specific app embeds. This page covers how that split actually works, using this repo's own examples as the reference.

## The backend: just an issuer

`examples/hono` is the reference backend - a plain `issuer()` composed onto a `Hono` app, with a real database (D1) and file storage (R2) behind it. Nothing about it assumes who's calling it or what frontend framework they're using - it only knows OAuth 2.1: `/authorize`, `/token`, `/userinfo`, and the `/.well-known/*` discovery endpoints.

It also mounts a couple of its own resource-server-style routes (`/avatar`, `/profile`) for things that are genuinely part of *this example's* product surface, not part of Base Auth's own API - see below for why those are instructive.

## The frontend: a client, not a fork

Any frontend - SSR or SPA, this repo's or someone else's - talks to the issuer through `@base-auth/core/client`: `authorize()` to start the flow, `exchange()` to trade the returned code for tokens, `verify()` to check a token and read its subject.

`examples/tanstack-start` and this docs site's own [account page](/account) are two independent, real frontends doing exactly this against the same issuer - neither one has any special access the other couldn't also get. That's the whole point of the split: the frontend is disposable and replaceable, the issuer isn't.

```ts
const { url, challenge } = await client.authorize(redirectUri, "code")
// ...redirect happens, user comes back with a code...
const exchanged = await client.exchange(code, redirectUri, challenge.verifier)
const verified = await client.verify(subjects, exchanged.tokens.access)
```

## How a third-party app integrates

There's no client-registration step in Base Auth today - any `client_id` string works, and PKCE (mandatory under OAuth 2.1) means a third party never needs a shared secret to start the flow. A "login with your app" integration is just:

1. Their app redirects to your issuer's `/authorize` with their own `redirect_uri` and a PKCE challenge.
2. Your issuer runs its normal login flow and redirects back to *their* `redirect_uri` with a code.
3. They exchange it for tokens the same way any of this repo's examples do - `client.exchange()`.

Verifying a token as a resource server (a backend receiving a request with an `Authorization: Bearer` header) is the same call regardless of who wrote the frontend that got the user signed in - construct a `client` pointed at the issuer and call `.verify()`, or, if the code happens to live in the same process as the issuer, call `auth.api.useSession({ headers })` instead for the same result with no HTTP round-trip. This isn't hypothetical: `examples/hono`'s own `/avatar` and `/profile` routes authenticate incoming requests exactly this way.

```ts
// Any resource server, anywhere - not just the issuer itself
const client = createClient({ issuer: "https://auth.example.com", clientID: "..." })
const verified = await client.verify(subjects, bearerToken)
if (verified.err) return new Response("Unauthorized", { status: 401 })
```

> **Try it.** Run `bun run dev` from the repo root, sign in through [this site's account page](/account), and watch `examples/hono`'s terminal - the avatar upload and profile update requests are a genuinely separate origin (`:3000`) calling the issuer's own resource-server routes (`:8787`) with a bearer token, the same way a real third-party backend would.
