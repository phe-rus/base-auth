import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { pushSQLiteSchema } from "drizzle-kit/api"
import { beforeEach, describe, expect, test } from "bun:test"
import { coreModels } from "@base-auth/core/adapter"
import { generateSqliteSchema } from "../src/generate-sqlite-schema.js"
import { drizzleAdapter } from "../src/drizzle-adapter.js"
import type { Adapter } from "@base-auth/core/adapter"

const schema = generateSqliteSchema(coreModels)

let adapter: Adapter

beforeEach(async () => {
  const sqlite = new Database(":memory:")
  const db = drizzle(sqlite, { schema })
  const { apply } = await pushSQLiteSchema(schema, db as any)
  await apply()
  adapter = drizzleAdapter(db, { provider: "sqlite", schema })
})

describe("drizzleAdapter", () => {
  test("create + findOne roundtrip", async () => {
    const now = new Date()
    const created = await adapter.create<{ id: string }>({
      model: "user",
      data: { id: "u1", createdAt: now, updatedAt: now },
    })
    expect(created.id).toBe("u1")

    const found = await adapter.findOne<{ id: string }>({
      model: "user",
      where: [{ field: "id", value: "u1" }],
    })
    expect(found?.id).toBe("u1")
  })

  test("findOne returns null when nothing matches", async () => {
    const found = await adapter.findOne({
      model: "user",
      where: [{ field: "id", value: "missing" }],
    })
    expect(found).toBeNull()
  })

  test("findMany with limit", async () => {
    const now = new Date()
    for (const id of ["a", "b", "c"]) {
      await adapter.create({
        model: "user",
        data: { id, createdAt: now, updatedAt: now },
      })
    }
    const all = await adapter.findMany({ model: "user" })
    expect(all).toHaveLength(3)

    const limited = await adapter.findMany({ model: "user", limit: 2 })
    expect(limited).toHaveLength(2)
  })

  test("update", async () => {
    const now = new Date()
    await adapter.create({
      model: "user",
      data: { id: "u1", createdAt: now, updatedAt: now },
    })
    const later = new Date(now.getTime() + 1000)
    const updated = await adapter.update<{ updatedAt: Date }>({
      model: "user",
      where: [{ field: "id", value: "u1" }],
      data: { updatedAt: later },
    })
    expect(updated?.updatedAt.getTime()).toBe(later.getTime())
  })

  test("delete", async () => {
    const now = new Date()
    await adapter.create({
      model: "user",
      data: { id: "u1", createdAt: now, updatedAt: now },
    })
    await adapter.delete({
      model: "user",
      where: [{ field: "id", value: "u1" }],
    })
    expect(await adapter.findMany({ model: "user" })).toHaveLength(0)
  })

  test("count", async () => {
    const now = new Date()
    for (const id of ["a", "b"]) {
      await adapter.create({
        model: "user",
        data: { id, createdAt: now, updatedAt: now },
      })
    }
    expect(await adapter.count({ model: "user" })).toBe(2)
    expect(
      await adapter.count({
        model: "user",
        where: [{ field: "id", value: "a" }],
      }),
    ).toBe(1)
  })
})
