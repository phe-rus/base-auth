import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // Matches tsconfig.json's "~/*" path - shadcn's components.json assumes
    // this alias, but only tsconfig knew about it (type-checking only) until
    // now - Vite needs its own resolver config too.
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ srcDirectory: "src" }),
    react(),
  ],
})
