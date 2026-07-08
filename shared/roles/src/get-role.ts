import type { Adapter } from "@base-auth/core/adapter"

interface RoleRow {
  id: string
  userId: string
  role: string
  createdAt: Date
}

/**
 * Standalone helper (not only reachable through the HTTP route) so an app
 * can call it directly from its own `success()` callback to put the role
 * in the subject, with no network round-trip.
 *
 * The first user ever created gets "admin" - persisted the first time
 * their role is looked up, not re-derived on every call. Everyone after
 * that gets `defaultRole`.
 */
export async function getUserRole(
  adapter: Adapter,
  userId: string,
  defaultRole = "user",
): Promise<string> {
  const existing = await adapter.findOne<RoleRow>({
    model: "role",
    where: [{ field: "userId", value: userId }],
  })
  if (existing) return existing.role

  const userCount = await adapter.count({ model: "user" })
  const role = userCount === 1 ? "admin" : defaultRole
  await adapter.create<RoleRow>({
    model: "role",
    data: {
      id: crypto.randomUUID(),
      userId,
      role,
      createdAt: new Date(),
    },
  })
  return role
}
