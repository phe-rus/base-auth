import { describe, expect, test } from "bun:test"
import { object, string } from "valibot"
import { issuer } from "../src/issuer.js"
import { createSubjects } from "../src/subject.js"
import { MemoryStorage } from "../src/storage/memory.js"
import { Provider } from "../src/provider/provider.js"
import type { Plugin } from "../src/plugin/index.js"
import { FakeAdapter } from "./fake-adapter.js"

const subjects = createSubjects({
  user: object({ userID: string() }),
})

const dummyProvider = {
  type: "dummy",
  init(route, ctx) {
    route.get("/authorize", async (c) =>
      ctx.success(c, { email: "foo@bar.com" }),
    )
  },
} satisfies Provider<{ email: string }>

function baseConfig() {
  return {
    storage: MemoryStorage(),
    subjects,
    allow: async () => true,
    providers: { dummy: dummyProvider },
    success: async (ctx: any) => {
      throw new Error("not used in this test")
    },
  }
}

describe("plugins", () => {
  test("mounts a plugin's routes on the issuer app, passing the adapter through ctx", async () => {
    let receivedAdapter: unknown
    const adapter = FakeAdapter()
    const plugin: Plugin = {
      name: "greet",
      init(route, ctx) {
        receivedAdapter = ctx.adapter
        route.get("/hello", (c) => c.json({ hello: "world" }))
      },
    }

    const app = issuer({ ...baseConfig(), adapter, plugins: [plugin] })
    const res = await app.request("/greet/hello")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ hello: "world" })
    expect(receivedAdapter).toBe(adapter)
  })

  test("throws when plugins are configured without an adapter", () => {
    const plugin: Plugin = {
      name: "greet",
      init(route) {
        route.get("/hello", (c) => c.text("hi"))
      },
    }

    expect(() => issuer({ ...baseConfig(), plugins: [plugin] })).toThrow()
  })

  test("throws when a plugin name collides with a provider", () => {
    const plugin: Plugin = {
      name: "dummy",
      init(route) {
        route.get("/x", (c) => c.text("x"))
      },
    }

    expect(() =>
      issuer({ ...baseConfig(), adapter: FakeAdapter(), plugins: [plugin] }),
    ).toThrow()
  })

  test("throws when a plugin name collides with a reserved route", () => {
    const plugin: Plugin = {
      name: "token",
      init(route) {
        route.get("/x", (c) => c.text("x"))
      },
    }

    expect(() =>
      issuer({ ...baseConfig(), adapter: FakeAdapter(), plugins: [plugin] }),
    ).toThrow()
  })
})
