import { object, string } from "valibot"
import { createClient } from "@base-auth/core/client"
import { createSubjects } from "@base-auth/core/subject"

// Points at examples/hono's dev server by default - override with
// VITE_ISSUER_URL to point at a different issuer.
export const issuerUrl =
  import.meta.env.VITE_ISSUER_URL ?? "http://localhost:8787"

export const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
  }),
})

export const client = createClient({
  clientID: "tanstack-start-example",
  issuer: issuerUrl,
})
