import { createFileRoute } from "@tanstack/react-router"
import { Callout, Code, H1, H2, P, Pre } from "../../components/prose"

export const Route = createFileRoute("/docs/architecture")({
  component: Architecture,
})

function Architecture() {
  return (
    <div>
      <H1>Architecture</H1>
      <P>
        Base Auth is meant to run as its own deployable unit - a separate
        service your frontends (however many of them, however different
        their stacks are) all talk to over HTTP, not a library one specific
        app embeds. This page covers how that split actually works, using
        this repo's own examples as the reference.
      </P>

      <H2>The backend: just an issuer</H2>
      <P>
        <code>examples/hono</code> is the reference backend - a plain{" "}
        <Code>issuer()</Code> composed onto a <Code>Hono</Code> app, with a
        real database (D1) and file storage (R2) behind it. Nothing about
        it assumes who's calling it or what frontend framework they're
        using - it only knows OAuth 2.1: <Code>/authorize</Code>,{" "}
        <Code>/token</Code>, <Code>/userinfo</Code>, and the{" "}
        <Code>/.well-known/*</Code> discovery endpoints.
      </P>
      <P>
        It also mounts a couple of its own resource-server-style routes (
        <Code>/avatar</Code>, <Code>/profile</Code>) for things that are
        genuinely part of *this example's* product surface, not part of
        Base Auth's own API - see below for why those are instructive.
      </P>

      <H2>The frontend: a client, not a fork</H2>
      <P>
        Any frontend - SSR or SPA, this repo's or someone else's - talks to
        the issuer through <Code>@base-auth/core/client</Code>:{" "}
        <Code>authorize()</Code> to start the flow, <Code>exchange()</Code>{" "}
        to trade the returned code for tokens, <Code>verify()</Code> to
        check a token and read its subject.
      </P>
      <P>
        <code>examples/tanstack-start</code> and this docs site's own{" "}
        <a href="/account" className="underline">
          account page
        </a>{" "}
        are two independent, real frontends doing exactly this against the
        same issuer - neither one has any special access the other
        couldn't also get. That's the whole point of the split: the
        frontend is disposable and replaceable, the issuer isn't.
      </P>
      <Pre>{`const { url, challenge } = await client.authorize(redirectUri, "code")
// ...redirect happens, user comes back with a code...
const exchanged = await client.exchange(code, redirectUri, challenge.verifier)
const verified = await client.verify(subjects, exchanged.tokens.access)`}</Pre>

      <H2>How a third-party app integrates</H2>
      <P>
        There's no client-registration step in Base Auth today - any{" "}
        <Code>client_id</Code> string works, and PKCE (mandatory under
        OAuth 2.1) means a third party never needs a shared secret to start
        the flow. A "login with your app" integration is just:
      </P>
      <P>
        1. Their app redirects to your issuer's <Code>/authorize</Code> with
        their own <Code>redirect_uri</Code> and a PKCE challenge.
        <br />
        2. Your issuer runs its normal login flow and redirects back to{" "}
        <em>their</em> <Code>redirect_uri</Code> with a code.
        <br />
        3. They exchange it for tokens the same way any of this repo's
        examples do - <Code>client.exchange()</Code>.
      </P>
      <P>
        Verifying a token as a resource server (a backend receiving a
        request with an <Code>Authorization: Bearer</Code> header) is the
        same call regardless of who wrote the frontend that got the user
        signed in - construct a <Code>client</Code> pointed at the issuer
        and call <Code>.verify()</Code>. This isn't hypothetical:{" "}
        <code>examples/hono</code>'s own <Code>/avatar</Code> and{" "}
        <Code>/profile</Code> routes authenticate incoming requests exactly
        this way, even though they happen to live in the same app as the
        issuer.
      </P>
      <Pre>{`// Any resource server, anywhere - not just the issuer itself
const client = createClient({ issuer: "https://auth.example.com", clientID: "..." })
const verified = await client.verify(subjects, bearerToken)
if (verified.err) return new Response("Unauthorized", { status: 401 })`}</Pre>
      <Callout type="tip" title="Try it">
        Run <code>bun run dev</code> from the repo root, sign in through{" "}
        <a href="/account" className="underline">
          this site's account page
        </a>
        , and watch <code>examples/hono</code>'s terminal - the avatar
        upload and profile update requests are a genuinely separate origin (
        <code>:3000</code>) calling the issuer's own resource-server routes
        (<code>:8787</code>) with a bearer token, the same way a real
        third-party backend would.
      </Callout>
    </div>
  )
}
