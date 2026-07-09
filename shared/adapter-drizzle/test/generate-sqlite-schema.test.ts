import { describe, expect, test } from "bun:test"
import type { ModelDefinition } from "@base-auth/core/adapter"
import { generateSqliteSchemaSource } from "../src/generate-sqlite-schema.js"

const models: Record<string, ModelDefinition> = {
  user: {
    fields: {
      id: { type: "string", required: true, unique: true },
      preferredName: { type: "string" },
      createdAt: { type: "date", required: true },
    },
  },
  account: {
    fields: {
      id: { type: "string", required: true, unique: true },
      userId: {
        type: "string",
        required: true,
        references: { model: "user", field: "id" },
      },
    },
  },
}

describe("generateSqliteSchemaSource", () => {
  test("emits a table per model with snake_case columns by default", () => {
    const source = generateSqliteSchemaSource(models)
    expect(source).toContain(`import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"`)
    expect(source).toContain(`export const user = sqliteTable("user", {`)
    expect(source).toContain(`id: text("id").primaryKey(),`)
    expect(source).toContain(`preferredName: text("preferred_name"),`)
    expect(source).toContain(`createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),`)
  })

  test("emits camelCase columns when configured", () => {
    const source = generateSqliteSchemaSource(models, { columnCase: "camelCase" })
    expect(source).toContain(`preferredName: text("preferredName"),`)
  })

  test("emits references as a thunk to the referenced table's field", () => {
    const source = generateSqliteSchemaSource(models)
    expect(source).toContain(
      `userId: text("user_id").notNull().references(() => user.id),`,
    )
  })

  test("pluralizes table names when configured, not the JS export name", () => {
    const source = generateSqliteSchemaSource(models, { usePlural: true })
    expect(source).toContain(`export const user = sqliteTable("users", {`)
  })

  test("emits a schema bundle of every model", () => {
    const source = generateSqliteSchemaSource(models)
    expect(source).toContain(`export const schema = { user, account }`)
  })
})
