import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server"
import { object, optional, string } from "valibot"
import { client } from "../lib/auth"
import { redirectUri } from "../lib/config"

const exchangeCode = createServerFn()
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const verifier = getCookie("pkce_verifier")
    deleteCookie("pkce_verifier")
    if (!verifier) throw new Error("Missing PKCE verifier - sign in again")

    const exchanged = await client.exchange(data.code, redirectUri, verifier)
    if (exchanged.err) throw new Error(exchanged.err.message)

    setCookie("access_token", exchanged.tokens.access, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    setCookie("refresh_token", exchanged.tokens.refresh, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  })

export const Route = createFileRoute("/callback")({
  validateSearch: object({
    code: optional(string()),
    state: optional(string()),
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    if (!deps.code) throw redirect({ to: "/" })
    await exchangeCode({ data: { code: deps.code } })
    throw redirect({ to: "/profile" })
  },
})
