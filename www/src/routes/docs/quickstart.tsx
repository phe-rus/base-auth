import { createFileRoute } from "@tanstack/react-router"
import { Callout, H1, H2, P, Pre } from "../../components/prose"

export const Route = createFileRoute("/docs/quickstart")({
  component: Quickstart,
})

function Quickstart() {
  return (
    <div>
      <H1>Quickstart</H1>
      <P>
        The fastest way to see the whole flow is the two examples in this
        repo: a Hono issuer with a full local backend (D1, KV, R2), and a
        TanStack Start client app that authenticates against it.
      </P>

      <H2>1. Run the issuer</H2>
      <P>
        <code>examples/hono</code> composes the issuer onto a regular{" "}
        <code>Hono</code> app, reading Cloudflare bindings via{" "}
        <code>cloudflare:workers</code> instead of a manual fetch wrapper -
        this is the idiomatic style, and the same app can mount other routes
        (like the avatar upload endpoint) alongside the issuer.
      </P>
      <Pre>{`import { Hono } from "hono"
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

const app = new Hono()
app.route(
  "/",
  issuer({
    subjects,
    adapter,
    storage: CloudflareStorage({ namespace: env.AUTH_KV }),
    providers: {
      password: PasswordProvider(PasswordUI({
        sendCode: async ({ email, code, url }) => console.log(email, code, url),
      })),
    },
    success: async (ctx, value) => {
      if (value.provider === "password") {
        return ctx.subject("user", { id: value.email })
      }
      throw new Error("Invalid provider")
    },
  }),
)
export default app`}</Pre>
      <Pre>{`cd examples/hono
bun run dev   # wrangler dev, http://localhost:8787`}</Pre>
      <Callout type="note" title="D1/KV/R2 are all local">
        <code>wrangler dev</code> simulates all three - nothing here talks
        to real Cloudflare infrastructure. See{" "}
        <code>examples/hono/package.json</code>'s <code>local</code> script
        to generate and apply migrations.
      </Callout>

      <H2>2. Sign in from a client</H2>
      <P>
        <code>examples/tanstack-start</code> uses{" "}
        <code>@base-auth/core/client</code> for the code flow: a loader
        calls <code>client.authorize()</code> to build the sign-in link, a{" "}
        <code>/callback</code> route calls <code>client.exchange()</code> and
        sets cookies, and a protected route calls{" "}
        <code>client.verify()</code>.
      </P>
      <Pre>{`const getSignInUrl = createServerFn().handler(async () => {
  const { url, challenge } = await client.authorize(redirectUri, "code")
  setCookie("pkce_verifier", challenge.verifier!, { httpOnly: true })
  return { url }
})`}</Pre>
      <Pre>{`cd examples/tanstack-start
bun run dev   # vite dev, http://localhost:3001`}</Pre>
      <P>
        Visit <code>http://localhost:3001</code>, click sign in, register
        with an email/password (the verification code is logged to the
        issuer's terminal), and you'll land on <code>/profile</code> showing
        the decoded subject from the access token - plus an avatar upload
        that proves the whole client/issuer/resource-server round trip.
      </P>

      <H2>Next</H2>
      <P>
        Both examples come up together with everything else if you run{" "}
        <code>bun run dev</code> from the repo root. See{" "}
        <a href="/docs/architecture" className="underline">
          Architecture
        </a>{" "}
        for how this backend/frontend split works and how a third-party app
        would integrate, or the{" "}
        <a href="/docs/issuer" className="underline">
          issuer() reference
        </a>{" "}
        for the full configuration surface.
      </P>
    </div>
  )
}
