import { describe, expect, test } from "bun:test"
import {
  findOrCreateUserByAccount,
  updateUserProfile,
} from "../src/adapter/identity.js"
import { FakeAdapter } from "./fake-adapter.js"

describe("findOrCreateUserByAccount", () => {
  test("creates a user and account on first sight", async () => {
    const adapter = FakeAdapter()
    const created = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "alice@example.com",
    })

    const users = await adapter.findMany({ model: "user" })
    const accounts = await adapter.findMany({ model: "account" })

    expect(users).toHaveLength(1)
    expect(accounts).toHaveLength(1)
    expect(created.id).toBe((users[0] as any).id)
  })

  test("returns the same user for a repeat login, no duplicates", async () => {
    const adapter = FakeAdapter()
    const first = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "alice@example.com",
    })
    const second = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "alice@example.com",
    })

    expect(second.id).toBe(first.id)
    expect(await adapter.findMany({ model: "user" })).toHaveLength(1)
    expect(await adapter.findMany({ model: "account" })).toHaveLength(1)
  })

  test("different providers for the same identifier are different accounts", async () => {
    const adapter = FakeAdapter()
    const password = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "alice@example.com",
    })
    const github = await findOrCreateUserByAccount(adapter, {
      providerId: "github",
      accountId: "alice@example.com",
    })

    expect(github.id).not.toBe(password.id)
    expect(await adapter.findMany({ model: "user" })).toHaveLength(2)
    expect(await adapter.findMany({ model: "account" })).toHaveLength(2)
  })
})

describe("updateUserProfile", () => {
  test("updates only the given fields on the given user", async () => {
    const adapter = FakeAdapter()
    const alice = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "alice@example.com",
    })
    const bob = await findOrCreateUserByAccount(adapter, {
      providerId: "password",
      accountId: "bob@example.com",
    })

    const updated = await updateUserProfile(adapter, alice.id, {
      avatar: "https://example.com/alice.png",
    })

    expect(updated.avatar).toBe("https://example.com/alice.png")
    expect(updated.id).toBe(alice.id)

    const bobRow = await adapter.findOne<{ avatar?: string }>({
      model: "user",
      where: [{ field: "id", value: bob.id }],
    })
    expect(bobRow?.avatar).toBeUndefined()
  })

  test("throws when the user doesn't exist", async () => {
    const adapter = FakeAdapter()
    await expect(
      updateUserProfile(adapter, "nonexistent", { avatar: "x" }),
    ).rejects.toThrow()
  })
})
