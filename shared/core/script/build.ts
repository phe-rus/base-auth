import { Glob, $ } from "bun"
import pkg from "../package.json"

await $`rm -rf dist`

// Barrel files (`export { x } from "./sibling.js"`) can't be built with
// every relative import marked external - esbuild drops the import
// statement but keeps the export, producing a file that throws at import
// time under plain Node (confirmed against the pre-existing src/index.ts).
// These need their relative imports actually bundled in, like ui/base.tsx
// already was.
const barrels = new Set([
  "./src/index.ts",
  "./src/adapter/index.ts",
  "./src/plugin/index.ts",
  "./src/provider/index.ts",
  "./src/ui/base.tsx",
])
const depsExternal = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]

const files = new Glob("./src/**/*.{ts,tsx}").scan()
for await (const file of files) {
  await Bun.build({
    format: "esm",
    target: "node",
    outdir: "dist/esm",
    external: barrels.has(file) ? depsExternal : ["*"],
    root: "src",
    entrypoints: [file],
  })
}
await $`tsc --outDir dist/types --declaration --emitDeclarationOnly --declarationMap`
