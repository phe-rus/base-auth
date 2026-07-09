import type { Config } from "drizzle-kit"
import path from "path"
import fs from "fs"

// wrangler's local D1 simulation drops a real sqlite file somewhere under
// .wrangler/ - find it so drizzle-kit can generate/apply migrations against
// the exact same local database `wrangler dev` is reading from, without
// ever touching a remote D1 instance.
const getLocalD1 = () => {
  try {
    const basePath = path.resolve(".wrangler")
    const dbFile = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .find((f) => f.endsWith(".sqlite"))
    if (!dbFile) throw new Error(`.sqlite file not found in ${basePath}`)
    return path.resolve(basePath, dbFile)
  } catch (err) {
    console.log(`Error  ${err}`)
  }
}

export default {
  out: "./.migrations",
  schema: "./schema.ts",
  dialect: "sqlite",
  dbCredentials: { url: getLocalD1() ?? "" },
} satisfies Config
