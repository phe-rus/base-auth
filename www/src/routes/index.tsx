import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: Home,
})

const features = [
  {
    title: "Self-hosted",
    body: "Runs entirely on your own infrastructure - Node, Bun, Lambda, or Cloudflare Workers. Nobody else's roadmap decides its future.",
  },
  {
    title: "Standards-based",
    body: "A real OAuth 2.0 issuer. Any client that speaks OAuth can use it - web, mobile, or third-party \"login with\" flows.",
  },
  {
    title: "Bring your own schema",
    body: "The adapter is a generic translator over a schema you own and migrate yourself - SQLite, D1, Postgres, whatever you pick, in your project.",
  },
  {
    title: "Opt-in plugins",
    body: "Roles, usernames, 2FA, and passkeys ship as separate packages that mount onto the issuer - not a monolith you can't trim down.",
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
          Base Auth is a standards-based OAuth 2.0 issuer with roles,
          passkeys, 2FA, and usernames as opt-in plugins - not baked into a
          service someone else can change the terms on.
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

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2">
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
    </main>
  )
}
