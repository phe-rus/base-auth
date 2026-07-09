import { useState, type PropsWithChildren, type ReactNode } from "react"

export function H1({ children }: PropsWithChildren) {
  return <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
}

export function H2({ children }: PropsWithChildren) {
  return <h2 className="mt-10 mb-3 text-xl font-semibold">{children}</h2>
}

export function P({ children }: PropsWithChildren) {
  return <p className="mb-4 leading-7 text-neutral-300">{children}</p>
}

export function Code({ children }: PropsWithChildren) {
  return (
    <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm">
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
      <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2.5 right-2.5 rounded border border-neutral-700 bg-neutral-950/80 px-2 py-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

export function List({ children }: PropsWithChildren) {
  return (
    <ul className="mb-4 list-disc space-y-1 pl-5 leading-7 text-neutral-300">
      {children}
    </ul>
  )
}

const calloutStyles = {
  note: "border-neutral-700 bg-neutral-900/60",
  tip: "border-emerald-900 bg-emerald-950/40",
  warn: "border-amber-900 bg-amber-950/40",
} as const

export function Callout({
  type = "note",
  title,
  children,
}: PropsWithChildren<{ type?: keyof typeof calloutStyles; title?: string }>) {
  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${calloutStyles[type]}`}>
      {title && <p className="mb-1 font-medium text-neutral-100">{title}</p>}
      <div className="leading-6 text-neutral-300">{children}</div>
    </div>
  )
}

export function CardGrid({ children }: PropsWithChildren) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  )
}

export function Card({
  href,
  title,
  icon,
  children,
}: PropsWithChildren<{ href: string; title: string; icon?: ReactNode }>) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-neutral-800 p-5 transition-colors hover:border-neutral-600 hover:bg-neutral-900/50"
    >
      {icon && <div className="mb-3 text-neutral-500">{icon}</div>}
      <h3 className="font-semibold text-neutral-100">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-neutral-400">{children}</p>
    </a>
  )
}
