import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server"
import { useForm } from "@tanstack/react-form"
import { IconLogout, IconUpload } from "@tabler/icons-react"
import { Button, buttonVariants } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"
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
      <main className="container max-w-md py-24 text-center">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in against <code>{issuerUrl}</code> (the <code>hono</code>{" "}
          example, by default) to see a real account page - current user,
          avatar upload, and profile updates, all built on this project's
          own client library.
        </p>
        <a href={state.url} className="mt-6 inline-block">
          <Button size="lg">Sign in</Button>
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatar ?? null,
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const form = useForm({
    defaultValues: { preferredName: profile.preferredName ?? "" },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const updated = await updatePreferredName({
          data: { preferredName: value.preferredName },
        })
        setProfile(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed")
      }
    },
  })

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
    <main className="container max-w-lg py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account</h1>
        <Button variant="outline" size="sm" onClick={onLogout} disabled={loggingOut}>
          <IconLogout className="size-4" />
          {loggingOut ? "Signing out..." : "Log out"}
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="size-16 rounded-full object-cover ring-1 ring-border"
            onError={() => setAvatarUrl(null)}
          />
        )}
        <Label
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "cursor-pointer",
          })}
        >
          <IconUpload className="size-4" />
          {uploading ? "Uploading..." : "Upload avatar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </Label>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{profile.email ?? "-"}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span>{profile.role}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="mt-8"
      >
        <form.Field name="preferredName">
          {(field) => (
            <>
              <Label htmlFor={field.name}>Preferred name</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="How should we address you?"
                />
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting} className="shrink-0">
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </>
          )}
        </form.Field>
      </form>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </main>
  )
}
