import { createFileRoute } from "@tanstack/react-router"
import raw from "~/documents/adapters.md?raw"
import { parseDoc } from "~/lib/docs"
import { docHead } from "~/lib/doc-head"
import { DocPage } from "~/components/doc-page"

const { frontmatter, html } = parseDoc(raw)

export const Route = createFileRoute("/docs/adapters")({
  head: () => docHead(frontmatter),
  component: () => <DocPage frontmatter={frontmatter} html={html} />,
})
