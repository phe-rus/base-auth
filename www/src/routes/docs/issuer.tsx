import { createFileRoute } from "@tanstack/react-router"
import { Code, H1, H2, P, Pre } from "../../components/prose"

export const Route = createFileRoute("/docs/issuer")({
  component: IssuerDocs,
})

function IssuerDocs() {
  return (
    <div>
      <H1>issuer()</H1>
      <P>
        Creates a Base Auth server - a <a href="https://hono.dev" className="underline">Hono</a>{" "}
        app you can deploy anywhere Hono runs: Node, Bun, Lambda, or
        Cloudflare Workers.
      </P>
      <Pre>{`import { issuer } from "@base-auth/core"

const app = issuer({
  providers: { ... },
  subjects,
  success: async (ctx, value) => { ... },
})`}</Pre>

      <H2>subjects</H2>
      <P>
        The shape of what the access token maps to. Define with{" "}
        <Code>createSubjects</Code> using any{" "}
        <a
          href="https://standardschema.dev"
          className="underline"
        >
          standard-schema
        </a>{" "}
        library (valibot, zod, etc).
      </P>
      <Pre>{`import { object, string } from "valibot"
import { createSubjects } from "@base-auth/core/subject"

const subjects = createSubjects({
  user: object({ id: string() }),
})`}</Pre>

      <H2>providers</H2>
      <P>
        The auth providers your server supports - third-party identity
        providers (GitHub, Google, ...) or built-in flows (password, code).
      </P>
      <Pre>{`import { GithubProvider } from "@base-auth/core/provider/github"
import { PasswordProvider } from "@base-auth/core/provider/password"

providers: {
  github: GithubProvider({ clientID, clientSecret, scopes: ["user:email"] }),
  password: PasswordProvider(...),
}`}</Pre>

      <H2>storage</H2>
      <P>
        Where ephemeral OAuth protocol state lives - auth codes, refresh
        tokens, signing keys. A KV interface, with{" "}
        <Code>MemoryStorage</Code> for local dev,{" "}
        <Code>CloudflareStorage</Code> for KV, and <Code>DynamoStorage</Code>{" "}
        for DynamoDB.
      </P>

      <H2>adapter</H2>
      <P>
        Where durable data lives - users, and whatever a plugin's own models
        need. Unlike <Code>storage</Code>, this isn't owned by Base Auth: you
        bring your own database and schema, and an adapter (like{" "}
        <Code>@base-auth/adapter-drizzle</Code>'s <Code>drizzleAdapter</Code>
        ) translates a generic create/find/update/delete contract against
        it. Configured once, shared by every plugin.
      </P>
      <Pre>{`import { drizzleAdapter } from "@base-auth/adapter-drizzle"
import { db, schema } from "./db.js"

issuer({
  adapter: drizzleAdapter(db, { provider: "sqlite", schema }),
  // ...
})`}</Pre>

      <H2>plugins</H2>
      <P>
        Opt-in capabilities that mount their own routes on the issuer -{" "}
        <Code>@base-auth/username</Code>, <Code>@base-auth/roles</Code>, and
        more to come. Each receives the shared <Code>adapter</Code> through
        context, so you never pass a database connection to a plugin
        yourself.
      </P>
      <Pre>{`import { UsernamePlugin } from "@base-auth/username"
import { RolesPlugin } from "@base-auth/roles"

issuer({
  adapter,
  plugins: [UsernamePlugin(), RolesPlugin()],
  // ...
})`}</Pre>

      <H2>success</H2>
      <P>
        Called once a provider's flow completes. Typesafe based on which
        providers you configured - inspect <Code>value.provider</Code> and
        return <Code>ctx.subject(type, properties)</Code>.
      </P>

      <H2>Other options</H2>
      <P>
        <Code>theme</Code> customizes the built-in UI, <Code>ttl</Code>{" "}
        controls access/refresh token lifetimes, <Code>allow</Code>{" "}
        overrides which redirect URIs are permitted, and <Code>error</Code>{" "}
        lets you render your own error page.
      </P>
    </div>
  )
}
