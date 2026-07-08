import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { client, subjects } from "../lib/auth"

const getProfile = createServerFn().handler(async () => {
  const access = getCookie("access_token")
  const refresh = getCookie("refresh_token")
  if (!access) return null

  const verified = await client.verify(subjects, access, { refresh })
  if (verified.err) return null

  if (verified.tokens) {
    setCookie("access_token", verified.tokens.access, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    setCookie("refresh_token", verified.tokens.refresh, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return verified.subject.properties
})

export const Route = createFileRoute("/profile")({
  loader: async () => {
    const profile = await getProfile()
    if (!profile) throw redirect({ to: "/" })
    return profile
  },
  component: Profile,
})

function Profile() {
  const profile = Route.useLoaderData()
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-neutral-400">Protected route - resolved via client.verify().</p>
      <pre className="mt-4 rounded bg-neutral-900 p-4">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  )
}
