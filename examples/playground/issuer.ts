import { Database } from "bun:sqlite"
import { object, string } from "valibot"
import { issuer } from "@base-auth/core"
import { createSubjects } from "@base-auth/core/subject"
import { MemoryStorage } from "@base-auth/core/storage/memory"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"
import { createDb, migrateDb, findOrCreateUserByAccount } from "@base-auth/adapter-drizzle"

// Local playground: runs the issuer straight off `shared/core/src` (via the
// package's "bun" export condition), so editing core source and hitting the
// server again reflects the change immediately - no build/publish step.
//
// Two separate stores, matching the split the DB adapter layer introduces:
// - MemoryStorage: ephemeral OAuth protocol state (codes, refresh tokens)
// - local.db (sqlite, via @base-auth/adapter-drizzle): durable user identity

const db = createDb(new Database("local.db"))
migrateDb(db)

const subjects = createSubjects({
  user: object({
    id: string(),
  }),
})

const app = issuer({
  subjects,
  storage: MemoryStorage(),
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
      const user = await findOrCreateUserByAccount(db, {
        providerId: "password",
        accountId: value.email,
      })
      return ctx.subject("user", { id: user.id })
    }
    throw new Error("Invalid provider")
  },
})

console.log("[playground] issuer running at http://localhost:3000")

export default {
  port: 3000,
  fetch: app.fetch,
}
