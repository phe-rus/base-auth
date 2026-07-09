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
    items: [{ to: "/docs/issuer", label: "issuer()" }],
  },
] as const

function DocsLayout() {
  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-6 py-10">
      <aside className="w-48 shrink-0">
        <nav className="sticky top-24 flex flex-col gap-6 text-sm">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: true }}
                    className="rounded px-2 py-1.5 text-neutral-400 hover:text-white [&.active]:bg-neutral-900 [&.active]:text-white"
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
        <Outlet />
      </article>
    </div>
  )
}
