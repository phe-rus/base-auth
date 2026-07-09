import { object, optional, string } from "valibot"
import { createClient } from "@base-auth/core/client"
import { createSubjects } from "@base-auth/core/subject"

// Points at examples/hono's dev server by default - override with
// VITE_ISSUER_URL to point at a different issuer.
export const issuerUrl =
  import.meta.env.VITE_ISSUER_URL ?? "http://localhost:8787"

// Mirrors examples/hono's own subjects schema exactly - valibot's object()
// silently strips any key not declared here, so this has to stay in sync
// with whatever the issuer actually puts in the JWT.
export const subjects = createSubjects({
  user: object({
    id: string(),
    email: optional(string()),
    role: string(),
  }),
})

export const client = createClient({
  clientID: "tanstack-start-example",
  issuer: issuerUrl,
})
