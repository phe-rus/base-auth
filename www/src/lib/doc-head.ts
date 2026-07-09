import type { DocFrontmatter } from "./docs"

export function docHead(fm: DocFrontmatter) {
  return {
    meta: [
      { title: `${fm.title} - Base Auth` },
      { name: "description", content: fm.description },
      { property: "og:title", content: fm.title },
      { property: "og:description", content: fm.description },
      { property: "og:type", content: "article" },
    ],
  }
}
