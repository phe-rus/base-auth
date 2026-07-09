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

// Matches www's default - respects system dark/light preference, no toggle
// UI (not needed for a bare reference example).
const THEME_SCRIPT = `
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark")
}
`.trim()

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
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <nav className="sticky top-0 z-10 flex gap-4 border-b border-border bg-background/80 p-4 backdrop-blur">
          <Link to="/" className="font-semibold">
            Base Auth
          </Link>
          <Link to="/profile">Profile</Link>
        </nav>
        <main className="container py-6">{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
