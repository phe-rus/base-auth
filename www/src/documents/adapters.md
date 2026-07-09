---
title: Adapters
description: The generic Adapter contract, the Drizzle implementation, and how to generate a real, editable schema.ts.
---

`Adapter` is where durable data lives - users, and whatever a plugin's own models need. It's a generic, ORM-agnostic interface: `@base-auth/core` itself has no idea Drizzle exists, and nothing about the issuer or its plugins is coupled to a specific database or ORM.

## The contract

```ts
interface Adapter {
  create<T>(input: { model: string; data: Record<string, unknown> }): Promise<T>
  findOne<T>(input: { model: string; where: Where[] }): Promise<T | null>
  findMany<T>(input: { model: string; where?: Where[]; limit?: number }): Promise<T[]>
  update<T>(input: { model: string; where: Where[]; data: Record<string, unknown> }): Promise<T | null>
  delete(input: { model: string; where: Where[] }): Promise<void>
  count(input: { model: string; where?: Where[] }): Promise<number>
}
```

Any implementation satisfying this works with `issuer({ adapter })` and every plugin - `@base-auth/adapter-drizzle`'s `drizzleAdapter` is the one that ships today, targeting SQLite and D1 (Postgres/MySQL are accepted in the type but not implemented yet).

```ts
import { drizzleAdapter } from "@base-auth/adapter-drizzle"

const adapter = drizzleAdapter(db, { provider: "sqlite", schema })
```

## Generating a real `schema.ts`

Plugins declare the tables they need declaratively (`ModelDefinition`/`FieldDefinition` - field types, `required`, `unique`, `references`), so a generator can turn them into real Drizzle tables. But a function call re-run on every boot isn't something you can rename a column in - so the actual recommended path is a small CLI that writes a real, ordinary, committed file instead:

```ts
// schema.config.ts
import { defineSchemaConfig } from "@base-auth/adapter-drizzle"
import { coreModels } from "@base-auth/core/adapter"
import { roleModels } from "@base-auth/roles"
import { usernameModels } from "@base-auth/username"

export default defineSchemaConfig({
  dialect: "sqlite",
  models: { ...coreModels, ...roleModels, ...usernameModels },
  columnCase: "snake_case", // or "camelCase"
})
```

```bash
bunx @base-auth/adapter-drizzle generate --config ./schema.config.ts --out ./schema.ts
```

This writes a file that looks exactly like one you'd hand-write:

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email"),
  preferred_name: text("preferred_name"),
  avatar: text("avatar"),
  created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
})
// ...account, role, username tables the same way

export const schema = { user, account, role, username }
```

From there it's your file - rename a column, add one, change a type, whatever the app needs. Run your ORM's normal migration workflow (`drizzle-kit generate`, `wrangler d1 migrations apply`, ...) against it exactly like you would for any hand-written schema. See `examples/hono`'s `schema.config.ts`/`schema.ts` for the real thing, including how it's wired into `package.json` scripts.

> Re-running `generate` overwrites the file - there's no diff/merge tooling. Generate once as a starting point, then it's yours, the same relationship you already have with `drizzle-kit generate`'s migration output.

## Identity resolution

Two provider-agnostic helpers, both exported from `@base-auth/core/adapter`, that every app's own `success()` callback calls directly - this is intentionally *not* built into `issuer()` itself, since user lookup/creation is exactly the part Base Auth leaves to you:

```ts
import { findOrCreateUserByAccount, updateUserProfile } from "@base-auth/core/adapter"

const user = await findOrCreateUserByAccount(
  adapter,
  { providerId: "password", accountId: value.email },
  { email: value.email }, // profile - only applied on first creation
)

// later, e.g. after an avatar upload
await updateUserProfile(adapter, user.id, { avatar: url })
```
