import { useState, type PropsWithChildren, type ReactNode } from "react"
import { IconAlertTriangle, IconBulb, IconInfoCircle } from "@tabler/icons-react"
import { Card, CardContent } from "~/components/ui/card"
import { cn } from "~/lib/utils"

export function H1({ children }: PropsWithChildren) {
  return <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
}

export function H2({ children }: PropsWithChildren) {
  return <h2 className="mt-10 mb-3 text-xl font-semibold">{children}</h2>
}

export function P({ children }: PropsWithChildren) {
  return <p className="mb-4 leading-7 text-muted-foreground">{children}</p>
}

export function Code({ children }: PropsWithChildren) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
      {children}
    </code>
  )
}

export function Pre({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative mb-4">
      <pre className="no-scrollbar overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2.5 right-2.5 rounded border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

export function List({ children }: PropsWithChildren) {
  return (
    <ul className="mb-4 list-disc space-y-1 pl-5 leading-7 text-muted-foreground">
      {children}
    </ul>
  )
}

const calloutConfig = {
  note: { icon: IconInfoCircle, className: "border-border bg-muted/40" },
  tip: {
    icon: IconBulb,
    className: "border-primary/30 bg-primary/5",
  },
  warn: {
    icon: IconAlertTriangle,
    className: "border-destructive/30 bg-destructive/5",
  },
} satisfies Record<string, { icon: typeof IconInfoCircle; className: string }>

export function Callout({
  type = "note",
  title,
  children,
}: PropsWithChildren<{ type?: keyof typeof calloutConfig; title?: string }>) {
  const { icon: Icon, className } = calloutConfig[type]
  return (
    <div className={cn("mb-4 flex gap-3 rounded-lg border p-4 text-sm", className)}>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        {title && <p className="mb-1 font-medium text-foreground">{title}</p>}
        <div className="leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

export function LinkCardGrid({ children }: PropsWithChildren) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  )
}

export function LinkCard({
  href,
  title,
  icon,
  children,
}: PropsWithChildren<{ href: string; title: string; icon?: ReactNode }>) {
  return (
    <a href={href} className="block transition-colors hover:ring-foreground/20">
      <Card className="h-full">
        <CardContent>
          {icon && <div className="dualTone mb-3 text-muted-foreground">{icon}</div>}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
            {children}
          </p>
        </CardContent>
      </Card>
    </a>
  )
}
