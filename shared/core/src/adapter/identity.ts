import type { Adapter } from "./adapter.js"

export interface FindOrCreateUserByAccountInput {
  providerId: string
  accountId: string
}

export interface User {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface Account {
  id: string
  userId: string
  providerId: string
  accountId: string
}

/**
 * Resolves the account provider identity for a login to a durable user
 * row, creating both the user and the account link on first sight. Every
 * provider's `success` callback needs this same lookup-or-create, so it
 * lives here once, against the generic `Adapter` contract - it works with
 * any adapter implementation, not just Drizzle.
 */
export async function findOrCreateUserByAccount(
  adapter: Adapter,
  input: FindOrCreateUserByAccountInput,
): Promise<User> {
  const existing = await adapter.findOne<Account>({
    model: "account",
    where: [
      { field: "providerId", value: input.providerId },
      { field: "accountId", value: input.accountId },
    ],
  })
  if (existing) {
    const owner = await adapter.findOne<User>({
      model: "user",
      where: [{ field: "id", value: existing.userId }],
    })
    if (!owner) throw new Error(`Account ${existing.id} has no owning user`)
    return owner
  }

  const now = new Date()
  const newUser = await adapter.create<User>({
    model: "user",
    data: { id: crypto.randomUUID(), createdAt: now, updatedAt: now },
  })
  await adapter.create<Account>({
    model: "account",
    data: {
      id: crypto.randomUUID(),
      userId: newUser.id,
      providerId: input.providerId,
      accountId: input.accountId,
      createdAt: now,
    },
  })
  return newUser
}
