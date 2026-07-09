#!/usr/bin/env bun
import { resolve } from "node:path"
import { writeFileSync } from "node:fs"
import { generateSqliteSchemaSource } from "./generate-sqlite-schema.js"
import type { SchemaConfig } from "./schema-config.js"

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg?.startsWith("--")) {
      args[arg.slice(2)] = argv[i + 1] ?? ""
      i++
    }
  }
  return args
}

async function generate(args: Record<string, string>) {
  if (!args.config) {
    console.error("Usage: base-auth-drizzle generate --config <path> [--out <path>]")
    process.exit(1)
  }

  const configPath = resolve(process.cwd(), args.config)
  const mod = await import(configPath)
  const config: SchemaConfig = mod.default
  if (!config) {
    console.error(`${args.config} has no default export`)
    process.exit(1)
  }
  if (config.dialect !== "sqlite") {
    console.error(
      `base-auth-drizzle generate: dialect "${config.dialect}" isn't implemented yet - only "sqlite" is`,
    )
    process.exit(1)
  }

  const outPath = resolve(process.cwd(), args.out ?? config.out ?? "./schema.ts")
  const source = generateSqliteSchemaSource(config.models, config)
  writeFileSync(outPath, source)
  console.log(`Wrote ${outPath}`)
}

const [command, ...rest] = process.argv.slice(2)
const args = parseArgs(rest)

if (command === "generate") {
  await generate(args)
} else {
  console.error("Usage: base-auth-drizzle generate --config <path> [--out <path>]")
  process.exit(1)
}
