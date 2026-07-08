import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { object, string } from "valibot"
import { issuer } from "@base-auth/core"
import { createSubjects } from "@base-auth/core/subject"
import { findOrCreateUserByAccount } from "@base-auth/core/adapter"
import { MemoryStorage } from "@base-auth/core/storage/memory"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"
import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import { UsernamePlugin } from "@base-auth/username"
import { RolesPlugin, getUserRole } from "@base-auth/roles"
import { schema } from "./schema.js"

// Local playground: runs the issuer straight off `shared/core/src` (via the
// package's "bun" export condition), so editing core source and hitting the
// server again reflects the change immediately - no build/publish step.
//
// Two separate stores, matching the split the DB adapter layer introduces:
// - MemoryStorage: ephemeral OAuth protocol state (codes, refresh tokens)
// - local.db (sqlite): durable user identity, via the app's own schema.ts
//   and migrations - not anything owned by our packages.

const db = drizzle(new Database("local.db"), { schema })
migrate(db, { migrationsFolder: "./migrations" })
const adapter = drizzleAdapter(db, { provider: "sqlite", schema })

const subjects = createSubjects({
  user: object({
    id: string(),
    role: string(),
  }),
})

const app = issuer({
  subjects,
  storage: MemoryStorage(),
  adapter,
  plugins: [UsernamePlugin(), RolesPlugin()],
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(`[playground] code for ${email}: ${code}`)
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const user = await findOrCreateUserByAccount(adapter, {
        providerId: "password",
        accountId: value.email,
      })
      const role = await getUserRole(adapter, user.id)
      return ctx.subject("user", { id: user.id, role })
    }
    throw new Error("Invalid provider")
  },
})

console.log("[playground] issuer running at http://localhost:3000")

export default {
  port: 3000,
  fetch: app.fetch,
}
