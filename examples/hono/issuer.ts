import { issuer } from "@base-auth/core"
import { createSubjects } from "@base-auth/core/subject"
import { CloudflareStorage } from "@base-auth/core/storage/cloudflare"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"
import { object, string } from "valibot"
import type { ExecutionContext, KVNamespace } from "@cloudflare/workers-types"

// Proves @base-auth/core's issuer() running as an actual Cloudflare Worker,
// using the storage adapter this package ships for exactly this target
// (@base-auth/core/storage/cloudflare, backed by KV). Kept deliberately
// minimal - no DB/plugins here, that's what examples/playground is for.

interface Env {
  AUTH_KV: KVNamespace
}

const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
  }),
})

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return issuer({
      subjects,
      storage: CloudflareStorage({
        namespace: env.AUTH_KV,
      }),
      providers: {
        password: PasswordProvider(
          PasswordUI({
            sendCode: async ({ email, code, url }) => {
              console.log(`[hono example] code for ${email}: ${code} (${url})`)
            },
          }),
        ),
      },
      success: async (ctx, value) => {
        if (value.provider === "password") {
          return ctx.subject("user", { id: value.email, email: value.email })
        }
        throw new Error("Invalid provider")
      },
    }).fetch(request, env, ctx)
  },
}
