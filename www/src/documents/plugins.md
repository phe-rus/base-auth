---
title: Plugins
description: The Plugin interface, the roles and username plugins as worked examples, and how to write your own.
---

Plugins are opt-in capabilities that sit alongside authentication - they mount their own routes on the issuer, but unlike providers, they don't participate in OAuth provider selection. Roles and usernames are the two that ship today; both are ordinary consumers of the same `Plugin` interface, not special-cased by core.

## The interface

```ts
interface PluginContext {
  adapter: Adapter
}

interface Plugin {
  name: string
  init(route: Hono, ctx: PluginContext): void
  models?: Record<string, ModelDefinition>
}
```

A plugin doesn't take its own database connection - `issuer({ adapter, plugins })` configures the adapter once, and every plugin receives it through `ctx`. If a plugin needs its own tables, it declares them via `models`, the same declarative shape core's own `coreModels` uses - see [Adapters](/docs/adapters) for how those turn into a real schema file.

```ts
issuer({
  adapter,
  plugins: [UsernamePlugin(), RolesPlugin()],
  // ...
})
```

## `@base-auth/roles`

Assigns and reads back a role per user - `getUserRole` is a standalone helper (not only reachable through HTTP) so your own `success()` callback can call it directly with no network round-trip:

```ts
import { RolesPlugin, getUserRole } from "@base-auth/roles"

const app = issuer({
  adapter,
  plugins: [RolesPlugin({ defaultRole: "user" })],
  success: async (ctx, value) => {
    const user = await findOrCreateUserByAccount(adapter, { ... })
    const role = await getUserRole(adapter, user.id) // first user ever -> "admin"
    return ctx.subject("user", { id: user.id, role })
  },
})
```

The first user ever created gets `"admin"`, persisted the first time their role is looked up (not re-derived on every call) - everyone after gets `defaultRole`.

## `@base-auth/username`

Reserves and looks up a unique username per user, mounted the same way:

```ts
import { UsernamePlugin } from "@base-auth/username"

issuer({
  adapter,
  plugins: [UsernamePlugin()],
  // ...
})
```

## Writing your own

A plugin is just an object matching the interface above - `init` receives the same kind of `Hono` sub-app a provider does, mounted at `/<plugin.name>` on the issuer.

```ts
import type { Plugin } from "@base-auth/core/plugin"

function MyPlugin(): Plugin {
  return {
    name: "my-plugin",
    models: {
      thing: {
        fields: {
          id: { type: "string", required: true, unique: true },
          userId: { type: "string", required: true, references: { model: "user", field: "id" } },
          value: { type: "string" },
        },
      },
    },
    init(route, ctx) {
      route.get("/:userId", async (c) => {
        const thing = await ctx.adapter.findOne({
          model: "thing",
          where: [{ field: "userId", value: c.req.param("userId") }],
        })
        return c.json(thing)
      })
    },
  }
}
```

Plugin names can't collide with a configured provider name or a reserved issuer route (`token`, `authorize`, `userinfo`, `.well-known`) - `issuer()` throws at construction time if they do.
