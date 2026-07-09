import type { Adapter } from "./adapter.js"

export interface FindOrCreateUserByAccountInput {
  providerId: string
  accountId: string
}

export interface UserProfile {
  email?: string
  preferredName?: string
  avatar?: string
}

export interface User {
  id: string
  email?: string
  preferredName?: string
  avatar?: string
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
 *
 * `profile` is only applied on creation - a repeat login never overwrites
 * an existing user's profile fields (that's what a dedicated "update
 * profile" call is for, not this one).
 */
export async function findOrCreateUserByAccount(
  adapter: Adapter,
  input: FindOrCreateUserByAccountInput,
  profile?: UserProfile,
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
    data: {
      id: crypto.randomUUID(),
      email: profile?.email,
      preferredName: profile?.preferredName,
      avatar: profile?.avatar,
      createdAt: now,
      updatedAt: now,
    },
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

/**
 * Updates profile fields on an already-existing user - the counterpart to
 * `findOrCreateUserByAccount`'s creation-only `profile` argument. Only the
 * fields passed in `profile` are changed; anything omitted is left as-is.
 */
export async function updateUserProfile(
  adapter: Adapter,
  userId: string,
  profile: UserProfile,
): Promise<User> {
  const updated = await adapter.update<User>({
    model: "user",
    where: [{ field: "id", value: userId }],
    data: { ...profile, updatedAt: new Date() },
  })
  if (!updated) throw new Error(`No user found with id ${userId}`)
  return updated
}
