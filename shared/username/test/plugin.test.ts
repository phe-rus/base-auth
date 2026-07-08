import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { pushSQLiteSchema } from "drizzle-kit/api"
import { Hono } from "hono"
import { beforeEach, describe, expect, test } from "bun:test"
import { coreModels, findOrCreateUserByAccount, type Adapter } from "@base-auth/core/adapter"
import { drizzleAdapter, generateSqliteSchema } from "@base-auth/adapter-drizzle"
import { UsernamePlugin } from "../src/plugin.js"
import { usernameModels } from "../src/models.js"

const schema = generateSqliteSchema({ ...coreModels, ...usernameModels })

let adapter: Adapter
let app: Hono

beforeEach(async () => {
  const sqlite = new Database(":memory:")
  const db = drizzle(sqlite, { schema })
  const { apply } = await pushSQLiteSchema(schema, db as any)
  await apply()

  adapter = drizzleAdapter(db, { provider: "sqlite", schema })
  app = new Hono()
  UsernamePlugin().init(app, { adapter })
})

async function makeUser(email: string) {
  return findOrCreateUserByAccount(adapter, {
    providerId: "password",
    accountId: email,
  })
}

describe("UsernamePlugin", () => {
  test("claims a username for a user", async () => {
    const user = await makeUser("alice@example.com")
    const res = await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, username: "alice" }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: user.id, username: "alice" })
  })

  test("rejects claiming a username already taken by another user", async () => {
    const alice = await makeUser("alice@example.com")
    const bob = await makeUser("bob@example.com")

    await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: alice.id, username: "same" }),
    })
    const res = await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: bob.id, username: "same" }),
    })

    expect(res.status).toBe(400)
  })

  test("rejects a second claim by the same user", async () => {
    const user = await makeUser("alice@example.com")
    await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, username: "first" }),
    })
    const res = await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, username: "second" }),
    })

    expect(res.status).toBe(400)
  })

  test("reports availability accurately", async () => {
    const user = await makeUser("alice@example.com")

    const before = await app.request("/available?username=alice")
    expect(await before.json()).toEqual({ available: true })

    await app.request("/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, username: "alice" }),
    })

    const after = await app.request("/available?username=alice")
    expect(await after.json()).toEqual({ available: false })
  })
})
