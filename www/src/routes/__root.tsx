import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import type { PropsWithChildren } from "react"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Base Auth by Pherus" },
      {
        name: "description",
        content:
          "A self-hosted, OAuth 2.1 auth server - roles and usernames as opt-in plugins, a generic adapter over a database you own.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 py-4 backdrop-blur">
          <Link to="/" className="font-semibold tracking-tight">
            Base Auth <span className="text-neutral-500">by Pherus</span>
          </Link>
          <nav className="flex gap-6 text-sm text-neutral-300">
            <Link to="/docs" className="hover:text-white">
              Docs
            </Link>
            <Link to="/account" className="hover:text-white">
              Account
            </Link>
            <a
              href="https://github.com/phe-rus/base-auth"
              className="hover:text-white"
            >
              GitHub
            </a>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
