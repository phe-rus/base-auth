import type { Plugin, PluginContext } from "@base-auth/core/plugin"
import { roleModels } from "./models.js"
import { getUserRole } from "./get-role.js"

interface RoleRow {
  id: string
  userId: string
  role: string
  createdAt: Date
}

export interface RolesPluginOptions {
  /** @default "user" */
  defaultRole?: string
}

/**
 * No `db`/adapter param - `issuer({ adapter, plugins: [RolesPlugin()] })`
 * configures the adapter once, and this plugin receives it through `ctx`
 * like every other plugin.
 */
export function RolesPlugin(options: RolesPluginOptions = {}): Plugin {
  const defaultRole = options.defaultRole ?? "user"

  return {
    name: "roles",
    models: roleModels,
    init(route, ctx: PluginContext) {
      route.get("/:userId", async (c) => {
        const userId = c.req.param("userId")
        const role = await getUserRole(ctx.adapter, userId, defaultRole)
        return c.json({ userId, role })
      })

      route.post("/assign", async (c) => {
        const body = await c.req.json<{ userId?: string; role?: string }>()
        const userId = body.userId
        const role = body.role
        if (!userId || !role)
          return c.json({ error: "`userId` and `role` are required" }, 400)

        const existing = await ctx.adapter.findOne<RoleRow>({
          model: "role",
          where: [{ field: "userId", value: userId }],
        })

        if (existing) {
          await ctx.adapter.update<RoleRow>({
            model: "role",
            where: [{ field: "userId", value: userId }],
            data: { role },
          })
        } else {
          await ctx.adapter.create<RoleRow>({
            model: "role",
            data: {
              id: crypto.randomUUID(),
              userId,
              role,
              createdAt: new Date(),
            },
          })
        }

        return c.json({ userId, role })
      })
    },
  }
}
