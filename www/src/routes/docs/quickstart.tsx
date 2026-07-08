import { createFileRoute } from "@tanstack/react-router"
import { H1, H2, P, Pre } from "../../components/prose"

export const Route = createFileRoute("/docs/quickstart")({
  component: Quickstart,
})

function Quickstart() {
  return (
    <div>
      <H1>Quickstart</H1>
      <P>
        The fastest way to see the whole flow is the two examples in this
        repo: a Hono issuer deployed to Cloudflare Workers, and a TanStack
        Start client app that authenticates against it.
      </P>

      <H2>1. Run the issuer</H2>
      <P>
        <code>examples/hono</code> is a minimal issuer using the password
        provider and Cloudflare KV storage.
      </P>
      <Pre>{`import { issuer } from "@base-auth/core"
import { CloudflareStorage } from "@base-auth/core/storage/cloudflare"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"

export default {
  async fetch(request, env, ctx) {
    return issuer({
      subjects,
      storage: CloudflareStorage({ namespace: env.AUTH_KV }),
      providers: {
        password: PasswordProvider(PasswordUI({
          sendCode: async (email, code) => console.log(email, code),
        })),
      },
      success: async (ctx, value) => {
        if (value.provider === "password") {
          return ctx.subject("user", { id: value.email })
        }
        throw new Error("Invalid provider")
      },
    }).fetch(request, env, ctx)
  },
}`}</Pre>
      <Pre>{`cd examples/hono
bun run dev   # wrangler dev, http://localhost:8787`}</Pre>

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
  const { url } = await client.authorize(redirectUri, "code")
  return { url }
})`}</Pre>
      <Pre>{`cd examples/tanstack-start
bun run dev   # vite dev, http://localhost:3001`}</Pre>
      <P>
        Visit <code>http://localhost:3001</code>, click sign in, register
        with an email/password (the verification code is logged to the
        issuer's terminal), and you'll land on <code>/profile</code> showing
        the decoded subject from the access token.
      </P>

      <H2>Next</H2>
      <P>
        Both examples come up together with everything else if you run{" "}
        <code>bun run dev</code> from the repo root. See the{" "}
        <a href="/docs/issuer" className="underline">
          issuer() reference
        </a>{" "}
        for the full configuration surface, including the adapter and
        plugins.
      </P>
    </div>
  )
}
