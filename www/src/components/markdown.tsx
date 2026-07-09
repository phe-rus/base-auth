import { useEffect, useRef } from "react"

/**
 * Renders parsed markdown HTML with Tailwind's typography plugin
 * (`.prose`), plus a copy button on every code block - added via a plain
 * DOM scan after mount, not a custom marked renderer, since it needs to
 * work on whatever HTML marked happens to produce without coupling this
 * component to marked's internals.
 */
export function Markdown({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const cleanups: Array<() => void> = []

    container.querySelectorAll("pre").forEach((pre) => {
      pre.classList.add("group", "relative", "no-scrollbar")
      const button = document.createElement("button")
      button.type = "button"
      button.textContent = "Copy"
      button.className =
        "absolute top-2.5 right-2.5 rounded border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? ""
        await navigator.clipboard.writeText(code)
        button.textContent = "Copied"
        setTimeout(() => (button.textContent = "Copy"), 1500)
      }
      button.addEventListener("click", onClick)
      pre.appendChild(button)
      cleanups.push(() => button.removeEventListener("click", onClick))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [html])

  return (
    <div
      ref={ref}
      className="prose prose-neutral dark:prose-invert max-w-none prose-pre:overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
