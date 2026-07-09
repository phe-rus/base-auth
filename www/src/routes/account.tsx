import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server"
import { client, issuerUrl, subjects } from "../lib/auth"
import { redirectUri } from "../lib/config"

interface Profile {
  id: string
  email?: string
  preferredName?: string
  avatar?: string
  role: string
  createdAt: string
  updatedAt: string
}

type AccountState =
  | { signedIn: false; url: string }
  | { signedIn: true; profile: Profile }

// Same PKCE + httpOnly cookie pattern examples/tanstack-start uses, folded
// into one loader: this page is either "sign in" or "here's your account,"
// never both, so there's no separate landing step the way the bare example
// has one (www's `/` is the marketing page, not a sign-in trigger).
const loadAccount = createServerFn().handler(async (): Promise<AccountState> => {
  const access = getCookie("access_token")
  const refresh = getCookie("refresh_token")

  if (access) {
    const verified = await client.verify(subjects, access, { refresh })
    if (!verified.err) {
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
      const token = verified.tokens?.access ?? access
      // Fresh from D1, not the JWT's claims at issuance time - reflects
      // anything changed since login (an avatar upload, a name update).
      const res = await fetch(`${issuerUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        return { signedIn: true, profile: (await res.json()) as Profile }
      }
    }
  }

  const { url, challenge } = await client.authorize(redirectUri, "code")
  setCookie("pkce_verifier", challenge.verifier!, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10,
  })
  return { signedIn: false, url }
})

const logout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie("access_token")
  deleteCookie("refresh_token")
})

const updatePreferredName = createServerFn({ method: "POST" })
  .validator((data: { preferredName: string }) => data)
  .handler(async ({ data }) => {
    const access = getCookie("access_token")
    if (!access) throw new Error("Not signed in")
    const res = await fetch(`${issuerUrl}/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preferredName: data.preferredName }),
    })
    if (!res.ok) throw new Error("Update failed")
    return (await res.json()) as Profile
  })

// The access token lives in an httpOnly cookie, so client-side JS can't
// attach it as a Bearer header itself - this proxies the upload through a
// server function instead, exactly like examples/tanstack-start's
// profile.tsx does.
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

export const Route = createFileRoute("/account")({
  loader: () => loadAccount(),
  component: Account,
})

function Account() {
  const state = Route.useLoaderData()
  const router = useRouter()

  if (!state.signedIn) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-3 text-neutral-400">
          Sign in against <code>{issuerUrl}</code> (the <code>hono</code>{" "}
          example, by default) to see a real account page - current user,
          avatar upload, and profile updates, all built on this project's
          own client library.
        </p>
        <a
          href={state.url}
          className="mt-6 inline-block rounded bg-white px-5 py-2.5 font-medium text-neutral-950"
        >
          Sign in
        </a>
      </main>
    )
  }

  return <SignedIn profile={state.profile} onSignOut={() => router.invalidate()} />
}

function SignedIn({
  profile: initial,
  onSignOut,
}: {
  profile: Profile
  onSignOut: () => void
}) {
  const [profile, setProfile] = useState(initial)
  const [name, setName] = useState(profile.preferredName ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatar ?? null,
  )
  const [savingName, setSavingName] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    setError(null)
    try {
      const updated = await updatePreferredName({ data: { preferredName: name } })
      setProfile(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
    } finally {
      setSavingName(false)
    }
  }

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

  async function onLogout() {
    setLoggingOut(true)
    await logout()
    onSignOut()
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account</h1>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="rounded border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:text-white"
        >
          {loggingOut ? "Signing out..." : "Log out"}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
            onError={() => setAvatarUrl(null)}
          />
        )}
        <label className="inline-block cursor-pointer rounded bg-white px-4 py-2 text-sm font-medium text-neutral-950">
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

      <dl className="mt-8 space-y-3 text-sm">
        <div className="flex justify-between border-b border-neutral-800 pb-3">
          <dt className="text-neutral-500">Email</dt>
          <dd>{profile.email ?? "-"}</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-800 pb-3">
          <dt className="text-neutral-500">Role</dt>
          <dd>{profile.role}</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-800 pb-3">
          <dt className="text-neutral-500">Member since</dt>
          <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>

      <form onSubmit={onSaveName} className="mt-8">
        <label className="block text-sm text-neutral-400" htmlFor="preferredName">
          Preferred name
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="preferredName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How should we address you?"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={savingName}
            className="shrink-0 rounded bg-white px-4 py-2 text-sm font-medium text-neutral-950"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </main>
  )
}
