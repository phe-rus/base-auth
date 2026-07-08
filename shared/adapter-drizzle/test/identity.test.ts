import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, test } from "bun:test"
import { createDb, migrateDb, type Db } from "../src/client.js"
import { findOrCreateUserByAccount } from "../src/identity.js"
import { account, user } from "../src/schema.js"

let db: Db

beforeEach(() => {
  db = createDb(new Database(":memory:"))
  migrateDb(db)
})

describe("findOrCreateUserByAccount", () => {
  test("creates a user and account on first sight", async () => {
    const created = await findOrCreateUserByAccount(db, {
      providerId: "password",
      accountId: "alice@example.com",
    })

    const users = await db.select().from(user)
    const accounts = await db.select().from(account)

    expect(users).toHaveLength(1)
    expect(accounts).toHaveLength(1)
    expect(created.id).toBe(users[0]!.id)
    expect(accounts[0]!.providerId).toBe("password")
    expect(accounts[0]!.accountId).toBe("alice@example.com")
  })

  test("returns the same user for a repeat login, no duplicates", async () => {
    const first = await findOrCreateUserByAccount(db, {
      providerId: "password",
      accountId: "alice@example.com",
    })
    const second = await findOrCreateUserByAccount(db, {
      providerId: "password",
      accountId: "alice@example.com",
    })

    expect(second.id).toBe(first.id)
    expect(await db.select().from(user)).toHaveLength(1)
    expect(await db.select().from(account)).toHaveLength(1)
  })

  test("different providers for the same identifier are different accounts", async () => {
    const password = await findOrCreateUserByAccount(db, {
      providerId: "password",
      accountId: "alice@example.com",
    })
    const github = await findOrCreateUserByAccount(db, {
      providerId: "github",
      accountId: "alice@example.com",
    })

    expect(github.id).not.toBe(password.id)
    expect(await db.select().from(user)).toHaveLength(2)
    expect(await db.select().from(account)).toHaveLength(2)
  })
})
