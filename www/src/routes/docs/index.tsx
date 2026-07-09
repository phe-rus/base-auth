import { createFileRoute } from "@tanstack/react-router"
import { Card, CardGrid, Code, H1, H2, List, P, Pre } from "../../components/prose"

export const Route = createFileRoute("/docs/")({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <div>
      <H1>Introduction</H1>
      <P>
        Base Auth is a standards-based auth provider for web apps, mobile
        apps, single page apps, APIs, or third-party clients - forked from{" "}
        <a
          href="https://github.com/toolbeam/openauth"
          className="underline"
        >
          SST's OpenAuth
        </a>{" "}
        and rebuilt into something you fully own: self-hosted, with roles
        and usernames as opt-in plugins instead of a fixed service.
      </P>

      <List>
        <li>
          <strong>Universal</strong> - deploy it standalone or embed it into
          an existing app. Works with any framework or platform.
        </li>
        <li>
          <strong>Self-hosted</strong> - runs entirely on your
          infrastructure: Node, Bun, Lambda, or Cloudflare Workers.
        </li>
        <li>
          <strong>OAuth 2.1</strong> - authorization code flow with
          mandatory PKCE, no implicit grant. Any OAuth 2.1 client can use it.
        </li>
        <li>
          <strong>Your schema, your dialect</strong> - the adapter is a
          generic translator over a database you own and migrate yourself.
        </li>
      </List>

      <H2>Approach</H2>
      <P>
        Most open source auth solutions are libraries meant to be embedded
        into a single application. Centralized auth servers are typically
        delivered as SaaS - Auth0, Clerk, and similar.
      </P>
      <P>
        Base Auth is a centralized auth server that runs on your own
        infrastructure, designed for self-hosting from the start. It adheres
        to OAuth 2.1, so anything that can speak OAuth can use it to receive
        access and refresh tokens - including third-party "login with your
        app" flows. See the <a href="/docs/architecture" className="underline">architecture guide</a>{" "}
        for exactly how that separation works.
      </P>
      <P>
        It intentionally doesn't solve user management for you the way a
        typical framework might - once a user has identified themselves, it
        invokes a callback where you look up or create them. What it does
        provide is a generic, ORM-agnostic <Code>Adapter</Code> contract for
        durable data (users, and whatever a plugin's own models need), and a{" "}
        <Code>Plugin</Code> interface so roles and usernames can mount onto
        the issuer without core needing to know they exist.
      </P>

      <H2>Quick example</H2>
      <Pre>{`import { issuer } from "@base-auth/core"
import { PasswordProvider } from "@base-auth/core/provider/password"
import { PasswordUI } from "@base-auth/core/ui/password"

export default issuer({
  subjects,
  providers: {
    password: PasswordProvider(PasswordUI({
      sendCode: async ({ email, code, url }) => { /* email it */ },
    })),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      return ctx.subject("user", { id: value.email })
    }
    throw new Error("Invalid provider")
  },
})`}</Pre>

      <H2>Next</H2>
      <CardGrid>
        <Card href="/docs/quickstart" title="Quickstart">
          A full walkthrough with a real client app - two examples running
          together.
        </Card>
        <Card href="/docs/architecture" title="Architecture">
          Separating the backend from the frontend, and how a third-party
          app integrates.
        </Card>
        <Card href="/docs/issuer" title="issuer() reference">
          The complete configuration surface.
        </Card>
        <Card href="/account" title="Account page">
          A real account page built on this project's own client library.
        </Card>
      </CardGrid>
    </div>
  )
}
