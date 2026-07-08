import { issuer } from "@base-auth/core"
import { handle } from "hono/aws-lambda"
import { subjects } from "../../subjects.js"
import { PasswordUI } from "@base-auth/core/ui/password"
import { PasswordProvider } from "@base-auth/core/provider/password"

async function getUser(email: string) {
  // Get user from database
  // Return user ID
  return "123"
}

const app = issuer({
  subjects,
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code)
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", {
        id: await getUser(value.email),
      })
    }
    throw new Error("Invalid provider")
  },
})

// @ts-ignore
export const handler = handle(app)
