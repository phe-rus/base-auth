import { Hono } from "hono"
import { cors } from "hono/cors"
import { env } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/d1"
import { object, optional, string } from "valibot"
import { issuer } from "@base-auth/core"
import { createSubjects } from "@base-auth/core/subject"
import { CloudflareStorage } from "@base-auth/core/storage/cloudflare"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"
import {
  findOrCreateUserByAccount,
  updateUserProfile,
  type User,
} from "@base-auth/core/adapter"
import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import { UsernamePlugin } from "@base-auth/username"
import { RolesPlugin, getUserRole } from "@base-auth/roles"
import { schema } from "./schema.js"

// Proves @base-auth/core's issuer() running as an actual Cloudflare Worker
// with a full local backend - KV for OAuth state, D1 for durable identity
// (via the generic drizzleAdapter, pointed at D1 instead of bun:sqlite), R2
// for avatar uploads. Composed the idiomatic Hono way: `env` comes from
// `cloudflare:workers` instead of threading it through a manual
// `fetch(request, env, ctx)` wrapper, and the avatar/profile routes below
// sit alongside the issuer on the same app via `app.route`, not bolted on
// separately.
//
// All three bindings run against wrangler's local simulation - see this
// package's `local`/`db:local` scripts. Nothing here talks to real
// Cloudflare resources.

const db = drizzle(env.DB, { schema })
const adapter = drizzleAdapter(db, { provider: "sqlite", schema })

const subjects = createSubjects({
  user: object({
    id: string(),
    email: optional(string()),
    role: string(),
  }),
})

const auth = issuer({
  subjects,
  storage: CloudflareStorage({
    namespace: env.AUTH_KV,
  }),
  adapter,
  plugins: [UsernamePlugin(), RolesPlugin()],
  providers: {
    password: PasswordProvider(
      PasswordUI({
        // Opt-in, off by default - explicit here since this is meant to be
        // the "full" example and the quickstart docs walk through watching
        // a code arrive in the terminal.
        verify: true,
        sendCode: async ({ email, code, url }) => {
          console.log(`[hono example] code for ${email}: ${code} (${url})`)
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const user = await findOrCreateUserByAccount(
        adapter,
        { providerId: "password", accountId: value.email },
        { email: value.email },
      )
      const role = await getUserRole(adapter, user.id)
      return ctx.subject("user", { id: user.id, email: user.email, role })
    }
    throw new Error("Invalid provider")
  },
})

const app = new Hono()
app.route("/", auth)

// Everything below is a resource server endpoint, not part of the issuer -
// the same shape a genuinely separate backend would use to accept a Base
// Auth access token. Since these routes happen to live in the same process
// as the issuer, `auth.api.useSession()` verifies in-process (no HTTP
// round-trip) - a genuinely separate backend would instead construct a
// `client` (`@base-auth/core/client`) pointed at the issuer's URL and call
// `client.verify()`, which is the same check over the network instead.
async function verifyBearer(c: import("hono").Context) {
  const session = await auth.api.useSession({ headers: c.req.raw.headers })
  return session?.type === "user" ? session.properties : null
}

const resourceCors = cors({
  origin: "*",
  allowHeaders: ["*"],
  allowMethods: ["GET", "POST", "PATCH"],
  credentials: false,
})

app.post("/avatar", resourceCors, async (c) => {
  const subject = await verifyBearer(c)
  if (!subject) return c.json({ error: "Invalid or missing bearer token" }, 401)

  const fd = await c.req.formData()
  const file = fd.get("avatar")
  if (!(file instanceof File))
    return c.json({ error: "Missing avatar file" }, 400)

  const userId = subject.id
  await env.AVATARS.put(`avatars/${userId}`, file, {
    httpMetadata: { contentType: file.type },
  })

  const url = `${new URL(c.req.url).origin}/avatar/${userId}`
  await updateUserProfile(adapter, userId, { avatar: url })

  return c.json({ url })
})

app.get("/avatar/:userId", async (c) => {
  const object = await env.AVATARS.get(`avatars/${c.req.param("userId")}`)
  if (!object) return c.notFound()
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
    },
  })
})

// GET/PATCH /profile: the "current user" primitive for an account page -
// deliberately distinct from the standard /userinfo endpoint above (which
// only re-derives from the JWT's claims at issuance time, per OAuth spec).
// This reads fresh from D1, so it reflects anything changed after the
// token was issued (an avatar upload, a preferredName update).
app.get("/profile", resourceCors, async (c) => {
  const subject = await verifyBearer(c)
  if (!subject) return c.json({ error: "Invalid or missing bearer token" }, 401)

  const user = await adapter.findOne<User>({
    model: "user",
    where: [{ field: "id", value: subject.id }],
  })
  if (!user) return c.json({ error: "User not found" }, 404)

  const role = await getUserRole(adapter, user.id)
  return c.json({ ...user, role })
})

app.patch("/profile", resourceCors, async (c) => {
  const subject = await verifyBearer(c)
  if (!subject) return c.json({ error: "Invalid or missing bearer token" }, 401)

  const body = await c.req.json<{ preferredName?: string }>()
  if (typeof body.preferredName !== "string")
    return c.json({ error: "Missing preferredName" }, 400)

  const user = await updateUserProfile(adapter, subject.id, {
    preferredName: body.preferredName,
  })
  return c.json(user)
})

export default app
