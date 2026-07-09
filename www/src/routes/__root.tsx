import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import type { PropsWithChildren } from "react"
import { IconBook2, IconBrandGithub, IconUserCircle } from "@tabler/icons-react"
import { buttonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"
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
      { property: "og:title", content: "Base Auth by Pherus" },
      {
        property: "og:description",
        content:
          "A self-hosted, OAuth 2.1 auth server - roles and usernames as opt-in plugins, a generic adapter over a database you own.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
})

// Respects system dark/light preference before first paint - no toggle UI
// (not asked for), but the shadcn preset's theme ships both palettes via
// the `.dark` class, so this avoids defaulting to light-only.
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

const navLink = "text-sm text-muted-foreground hover:text-foreground transition-colors"

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="container flex items-center justify-between py-4">
            <Link to="/" className="font-semibold tracking-tight">
              Base Auth <span className="text-muted-foreground">by Pherus</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/docs" className={cn(navLink, "flex items-center gap-1.5")}>
                <IconBook2 className="size-4" />
                Docs
              </Link>
              <Link to="/account" className={cn(navLink, "flex items-center gap-1.5")}>
                <IconUserCircle className="size-4" />
                Account
              </Link>
              <a
                href="https://github.com/phe-rus/base-auth"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <IconBrandGithub className="size-4" />
                GitHub
              </a>
            </nav>
          </div>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
