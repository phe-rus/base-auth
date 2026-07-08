import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { pushSQLiteSchema } from "drizzle-kit/api"
import { Hono } from "hono"
import { beforeEach, describe, expect, test } from "bun:test"
import { coreModels, findOrCreateUserByAccount, type Adapter } from "@base-auth/core/adapter"
import { drizzleAdapter, generateSqliteSchema } from "@base-auth/adapter-drizzle"
import { RolesPlugin } from "../src/plugin.js"
import { getUserRole } from "../src/get-role.js"
import { roleModels } from "../src/models.js"

const schema = generateSqliteSchema({ ...coreModels, ...roleModels })

let adapter: Adapter
let app: Hono

beforeEach(async () => {
  const sqlite = new Database(":memory:")
  const db = drizzle(sqlite, { schema })
  const { apply } = await pushSQLiteSchema(schema, db as any)
  await apply()

  adapter = drizzleAdapter(db, { provider: "sqlite", schema })
  app = new Hono()
  RolesPlugin().init(app, { adapter })
})

async function makeUser(email: string) {
  return findOrCreateUserByAccount(adapter, {
    providerId: "password",
    accountId: email,
  })
}

describe("RolesPlugin", () => {
  test("returns the default role before any assignment", async () => {
    const user = await makeUser("alice@example.com")
    const res = await app.request(`/${user.id}`)
    expect(await res.json()).toEqual({ userId: user.id, role: "user" })
  })

  test("assigns a role and reflects it on a repeat get", async () => {
    const user = await makeUser("alice@example.com")
    await app.request("/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: "admin" }),
    })
    const res = await app.request(`/${user.id}`)
    expect(await res.json()).toEqual({ userId: user.id, role: "admin" })
  })

  test("assigning again updates the role rather than duplicating", async () => {
    const user = await makeUser("alice@example.com")
    await app.request("/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: "admin" }),
    })
    await app.request("/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: "editor" }),
    })

    const res = await app.request(`/${user.id}`)
    expect(await res.json()).toEqual({ userId: user.id, role: "editor" })
    expect(
      await adapter.count({
        model: "role",
        where: [{ field: "userId", value: user.id }],
      }),
    ).toBe(1)
  })

  test("getUserRole() helper matches the route, no HTTP needed", async () => {
    const user = await makeUser("alice@example.com")
    expect(await getUserRole(adapter, user.id)).toBe("user")

    await app.request("/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: "admin" }),
    })
    expect(await getUserRole(adapter, user.id)).toBe("admin")
  })

  test("custom defaultRole option", async () => {
    const customApp = new Hono()
    RolesPlugin({ defaultRole: "guest" }).init(customApp, { adapter })
    const user = await makeUser("bob@example.com")
    const res = await customApp.request(`/${user.id}`)
    expect(await res.json()).toEqual({ userId: user.id, role: "guest" })
  })
})
