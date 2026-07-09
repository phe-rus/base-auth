import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardGrid } from "../components/prose"

export const Route = createFileRoute("/")({
  component: Home,
})

const features = [
  {
    title: "Self-hosted",
    body: "Runs entirely on your own infrastructure - Node, Bun, Lambda, or Cloudflare Workers. Nobody else's roadmap decides its future.",
  },
  {
    title: "OAuth 2.1",
    body: "Authorization code flow with mandatory PKCE, no implicit grant. Any OAuth 2.1 client can use it - web, mobile, or third-party \"login with\" flows.",
  },
  {
    title: "Bring your own schema",
    body: "The adapter is a generic translator over a database you own and migrate yourself - SQLite, D1, Postgres, whatever you pick, in your project.",
  },
  {
    title: "Opt-in plugins",
    body: "Roles and usernames ship as separate packages that mount onto the issuer through the same Adapter contract - not a monolith you can't trim down.",
  },
]

function Home() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          A self-hosted auth server,
          <br />
          on your infrastructure.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
          Base Auth is an OAuth 2.1 issuer with roles and usernames as
          opt-in plugins - not baked into a service someone else can change
          the terms on.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/docs"
            className="rounded bg-white px-5 py-2.5 font-medium text-neutral-950"
          >
            Get started
          </Link>
          <a
            href="https://github.com/phe-rus/base-auth"
            className="rounded border border-neutral-700 px-5 py-2.5 font-medium"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 pb-16 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-neutral-800 p-6"
          >
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-neutral-400">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="mb-4 text-sm font-medium tracking-wide text-neutral-500 uppercase">
          Get started
        </h2>
        <CardGrid>
          <Card href="/docs/quickstart" title="Quickstart">
            Run the issuer and a client app together in a couple minutes -
            two real, working examples, not a snippet you have to adapt.
          </Card>
          <Card href="/docs/architecture" title="Architecture">
            How the backend and frontend split apart, and how a genuinely
            third-party app would integrate against your issuer.
          </Card>
          <Card href="/docs/issuer" title="issuer() reference">
            The full configuration surface - providers, storage, the
            adapter, plugins, and subjects.
          </Card>
          <Card href="/account" title="Try the account page">
            A real, working account page - sign in, view your profile,
            upload an avatar, update your name - built on this project's
            own client library.
          </Card>
        </CardGrid>
      </section>
    </main>
  )
}
