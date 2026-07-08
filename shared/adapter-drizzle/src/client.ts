import type { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import * as schema from "./schema.js"

export type Db = BunSQLiteDatabase<typeof schema>

export function createDb(sqlite: Database): Db {
  return drizzle(sqlite, { schema })
}

const migrationsFolder = new URL("../migrations", import.meta.url).pathname

export function migrateDb(db: Db) {
  migrate(db, { migrationsFolder })
}
