import { useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { client, issuerUrl, subjects } from "../lib/auth"

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

// The access token lives in an httpOnly cookie (by design - client-side JS
// never sees it), so the browser can't attach it as a Bearer header itself.
// This proxies the upload through a server function instead: it reads the
// cookie server-side and forwards the file to examples/hono's /avatar with
// the token attached, the same way any other trusted backend would call a
// separate resource server on the signed-in user's behalf.
const uploadAvatar = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const access = getCookie("access_token")
    if (!access) throw new Error("Not signed in")

    const res = await fetch(`${issuerUrl}/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      body: data,
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error ?? "Upload failed")
    }
    return (await res.json()) as { url: string }
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    `${issuerUrl}/avatar/${profile.id}`,
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set("avatar", file)
      const result = await uploadAvatar({ data: fd })
      setAvatarUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-neutral-400">
        Protected route - resolved via client.verify().
      </p>

      <div className="mt-4 flex items-center gap-4">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
            onError={() => setAvatarUrl(null)}
          />
        )}
        <label className="inline-block cursor-pointer rounded bg-white px-4 py-2 font-medium text-neutral-950">
          {uploading ? "Uploading..." : "Upload avatar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-red-400">{error}</p>}

      <pre className="mt-4 rounded bg-neutral-900 p-4">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  )
}
