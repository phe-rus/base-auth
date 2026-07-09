import matter from "gray-matter"
import { marked } from "marked"

export interface DocFrontmatter {
  title: string
  description: string
}

export interface ParsedDoc {
  frontmatter: DocFrontmatter
  html: string
}

/**
 * Docs content lives in src/documents/*.md, not JSX - editing a page is
 * editing markdown, not React components. Each route imports its file via
 * Vite's `?raw` suffix and parses it with this at request/render time.
 */
export function parseDoc(raw: string): ParsedDoc {
  const { data, content } = matter(raw)
  return {
    frontmatter: data as DocFrontmatter,
    html: marked.parse(content, { async: false, gfm: true }) as string,
  }
}
