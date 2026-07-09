import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { setCookie } from "@tanstack/react-start/server"
import { Button } from "~/components/ui/button"
import { client, issuerUrl } from "../lib/auth"
import { redirectUri } from "../lib/config"

// OAuth 2.1 mandates PKCE for every client - client.authorize() always
// generates a verifier now. For an SSR app it can't live in localStorage
// (no browser yet at this point), so it rides along in a short-lived
// httpOnly cookie across the redirect, read back in routes/callback.tsx.
const getSignInUrl = createServerFn().handler(async () => {
  const { url, challenge } = await client.authorize(redirectUri, "code")
  setCookie("pkce_verifier", challenge.verifier!, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
  })
  return { url }
})

export const Route = createFileRoute("/")({
  loader: () => getSignInUrl(),
  component: Home,
})

function Home() {
  const { url } = Route.useLoaderData()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Base Auth - TanStack Start example</h1>
      <p className="text-muted-foreground">
        Signs in against the issuer at <code>{issuerUrl}</code> (the{" "}
        <code>hono</code> example, by default).
      </p>
      <a href={url} className="inline-block">
        <Button>Sign in</Button>
      </a>
    </div>
  )
}
