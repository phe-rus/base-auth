import { object, optional, string } from "valibot"
import { createClient } from "@base-auth/core/client"
import { createSubjects } from "@base-auth/core/subject"

// Points at examples/hono's dev server by default - override with
// VITE_ISSUER_URL to point at a different issuer. Mirrors
// examples/tanstack-start's lib/auth.ts exactly - this account page is the
// same pattern, just inside the docs site instead of a bare example.
export const issuerUrl =
  import.meta.env.VITE_ISSUER_URL ?? "http://localhost:8787"

// Has to stay in sync with whatever the issuer actually puts in the JWT -
// valibot's object() silently strips any key not declared here.
export const subjects = createSubjects({
  user: object({
    id: string(),
    email: optional(string()),
    role: string(),
  }),
})

export const client = createClient({
  clientID: "www-account",
  issuer: issuerUrl,
})
