import type { DocFrontmatter } from "~/lib/docs"
import { Markdown } from "./markdown"

export function DocPage({
  frontmatter,
  html,
}: {
  frontmatter: DocFrontmatter
  html: string
}) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{frontmatter.title}</h1>
      <Markdown html={html} />
    </>
  )
}
