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
      { title: "Base Auth - TanStack Start example" },
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
        <nav className="sticky top-0 z-10 flex gap-4 border-b border-neutral-800 bg-neutral-950/80 p-4 backdrop-blur">
          <Link to="/" className="font-semibold">
            Base Auth
          </Link>
          <Link to="/profile">Profile</Link>
        </nav>
        <main className="p-6">{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
