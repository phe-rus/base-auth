import type { Adapter } from "@base-auth/core/adapter"

interface RoleRow {
  userId: string
  role: string
}

/**
 * Standalone helper (not only reachable through the HTTP route) so an app
 * can call it directly from its own `success()` callback to put the role
 * in the subject, with no network round-trip.
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
  return existing?.role ?? defaultRole
}
