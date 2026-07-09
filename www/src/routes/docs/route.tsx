import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
})

const navGroups = [
  {
    label: "Guides",
    items: [
      { to: "/docs", label: "Introduction" },
      { to: "/docs/quickstart", label: "Quickstart" },
      { to: "/docs/architecture", label: "Architecture" },
    ],
  },
  {
    label: "Reference",
    items: [
      { to: "/docs/issuer", label: "issuer()" },
      { to: "/docs/providers", label: "Providers" },
      { to: "/docs/adapters", label: "Adapters" },
      { to: "/docs/plugins", label: "Plugins" },
      { to: "/docs/client", label: "Client" },
    ],
  },
] as const

function DocsLayout() {
  return (
    <div className="container flex gap-10 py-10">
      <aside className="w-48 shrink-0">
        <nav className="no-scrollbar sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-6 overflow-y-auto text-sm">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: true }}
                    className="rounded px-2 py-1.5 text-muted-foreground hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 flex-1 pb-24">
        <div className="mx-auto md:max-w-2xl">
          <Outlet />
        </div>
      </article>
    </div>
  )
}
