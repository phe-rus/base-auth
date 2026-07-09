import { createFileRoute, Link } from "@tanstack/react-router"
import {
  IconLock,
  IconPlugConnected,
  IconServer2,
  IconShieldLock,
} from "@tabler/icons-react"
import { LinkCard, LinkCardGrid } from "~/components/prose"
import { buttonVariants } from "~/components/ui/button"

export const Route = createFileRoute("/")({
  component: Home,
})

const features = [
  {
    icon: IconServer2,
    title: "Self-hosted",
    body: "Runs entirely on your own infrastructure - Node, Bun, Lambda, or Cloudflare Workers. Nobody else's roadmap decides its future.",
  },
  {
    icon: IconShieldLock,
    title: "OAuth 2.1",
    body: 'Authorization code flow with mandatory PKCE, no implicit grant. Any OAuth 2.1 client can use it - web, mobile, or third-party "login with" flows.',
  },
  {
    icon: IconLock,
    title: "Bring your own schema",
    body: "The adapter is a generic translator over a database you own and migrate yourself - SQLite, D1, Postgres, whatever you pick, in your project.",
  },
  {
    icon: IconPlugConnected,
    title: "Opt-in plugins",
    body: "Roles and usernames ship as separate packages that mount onto the issuer through the same Adapter contract - not a monolith you can't trim down.",
  },
]

function Home() {
  return (
    <main>
      <section className="container py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          A self-hosted auth server,
          <br />
          on your infrastructure.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Base Auth is an OAuth 2.1 issuer with roles and usernames as
          opt-in plugins - not baked into a service someone else can change
          the terms on.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/docs" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <a
            href="https://github.com/phe-rus/base-auth"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="container grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-border p-6">
            <feature.icon className="dualTone mb-3 size-6 text-muted-foreground" />
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="container pb-24">
        <h2 className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Get started
        </h2>
        <LinkCardGrid>
          <LinkCard href="/docs/quickstart" title="Quickstart">
            Run the issuer and a client app together in a couple minutes -
            two real, working examples, not a snippet you have to adapt.
          </LinkCard>
          <LinkCard href="/docs/architecture" title="Architecture">
            How the backend and frontend split apart, and how a genuinely
            third-party app would integrate against your issuer.
          </LinkCard>
          <LinkCard href="/docs/issuer" title="issuer() reference">
            The full configuration surface - providers, storage, the
            adapter, plugins, and subjects.
          </LinkCard>
          <LinkCard href="/account" title="Try the account page">
            A real, working account page - sign in, view your profile,
            upload an avatar, update your name - built on this project's
            own client library.
          </LinkCard>
        </LinkCardGrid>
      </section>
    </main>
  )
}
