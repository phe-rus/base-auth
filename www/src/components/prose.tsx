import type { PropsWithChildren } from "react"

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

export function Pre({ children }: PropsWithChildren) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
      <code>{children}</code>
    </pre>
  )
}

export function List({ children }: PropsWithChildren) {
  return (
    <ul className="mb-4 list-disc space-y-1 pl-5 leading-7 text-neutral-300">
      {children}
    </ul>
  )
}
