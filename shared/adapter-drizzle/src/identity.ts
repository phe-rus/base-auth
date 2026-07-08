import { and, eq } from "drizzle-orm"
import type { Db } from "./client.js"
import { account, user } from "./schema.js"

export interface FindOrCreateUserByAccountInput {
  providerId: string
  accountId: string
}

/**
 * Resolves the account provider identity for a login to a durable user row,
 * creating both the user and the account link on first sight. Every
 * provider's `success` callback needs this same lookup-or-create, so it
 * lives here once instead of being reimplemented per plugin.
 */
export async function findOrCreateUserByAccount(
  db: Db,
  input: FindOrCreateUserByAccountInput,
) {
  const existing = await db.query.account.findFirst({
    where: and(
      eq(account.providerId, input.providerId),
      eq(account.accountId, input.accountId),
    ),
  })
  if (existing) {
    const owner = await db.query.user.findFirst({
      where: eq(user.id, existing.userId),
    })
    if (!owner) throw new Error(`Account ${existing.id} has no owning user`)
    return owner
  }

  const newUser = { id: crypto.randomUUID() }
  await db.insert(user).values(newUser)
  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: newUser.id,
    providerId: input.providerId,
    accountId: input.accountId,
  })
  const created = await db.query.user.findFirst({
    where: eq(user.id, newUser.id),
  })
  if (!created) throw new Error(`Failed to create user ${newUser.id}`)
  return created
}
