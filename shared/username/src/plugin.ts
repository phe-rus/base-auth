import type { Plugin, PluginContext } from "@base-auth/core/plugin"
import { usernameModels } from "./models.js"

interface UsernameRow {
  id: string
  userId: string
  username: string
  createdAt: Date
}

/**
 * No `db`/adapter param - `issuer({ adapter, plugins: [UsernamePlugin()] })`
 * configures the adapter once, and this plugin receives it through `ctx`
 * like every other plugin.
 */
export function UsernamePlugin(): Plugin {
  return {
    name: "username",
    models: usernameModels,
    init(route, ctx: PluginContext) {
      route.get("/available", async (c) => {
        const value = c.req.query("username")
        if (!value)
          return c.json({ error: "missing `username` query parameter" }, 400)
        const existing = await ctx.adapter.findOne<UsernameRow>({
          model: "username",
          where: [{ field: "username", value }],
        })
        return c.json({ available: !existing })
      })

      route.post("/claim", async (c) => {
        const body = await c.req.json<{ userId?: string; username?: string }>()
        const userId = body.userId
        const value = body.username
        if (!userId || !value)
          return c.json({ error: "`userId` and `username` are required" }, 400)

        const existingForUser = await ctx.adapter.findOne<UsernameRow>({
          model: "username",
          where: [{ field: "userId", value: userId }],
        })
        if (existingForUser)
          return c.json({ error: "user already has a username" }, 400)

        const existingForName = await ctx.adapter.findOne<UsernameRow>({
          model: "username",
          where: [{ field: "username", value }],
        })
        if (existingForName)
          return c.json({ error: "username is taken" }, 400)

        await ctx.adapter.create<UsernameRow>({
          model: "username",
          data: {
            id: crypto.randomUUID(),
            userId,
            username: value,
            createdAt: new Date(),
          },
        })
        return c.json({ userId, username: value })
      })
    },
  }
}
