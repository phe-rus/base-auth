import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { client, issuerUrl } from "../lib/auth"
import { redirectUri } from "../lib/config"

const getSignInUrl = createServerFn().handler(async () => {
  const { url } = await client.authorize(redirectUri, "code")
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
      <p className="text-neutral-400">
        Signs in against the issuer at <code>{issuerUrl}</code> (the{" "}
        <code>hono</code> example, by default).
      </p>
      <a
        href={url}
        className="inline-block rounded bg-white px-4 py-2 font-medium text-neutral-950"
      >
        Sign in
      </a>
    </div>
  )
}
