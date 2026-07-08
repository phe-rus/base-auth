import { and, or, eq, ne, gt, gte, lt, lte, inArray, like } from "drizzle-orm"
import type { Adapter, Where } from "@base-auth/core/adapter"

export interface DrizzleAdapterOptions {
  /**
   * Only "sqlite" is implemented right now - "pg"/"mysql" are accepted so
   * the option shape doesn't have to change later, but there's no
   * Postgres/MySQL instance here to build and verify that path against.
   */
  provider: "sqlite" | "pg" | "mysql"
  /** The app's own schema - whatever `generateSqliteSchema` produced, or a hand-written one. */
  schema: Record<string, any>
  /** @default false */
  usePlural?: boolean
}

function resolveTable(options: DrizzleAdapterOptions, model: string) {
  const key = options.usePlural ? `${model}s` : model
  const table = options.schema[key]
  if (!table)
    throw new Error(`No table found for model "${model}" (looked for "${key}")`)
  return table
}

function buildWhere(table: any, where: Where[] = []) {
  if (where.length === 0) return undefined
  const conditions = where.map((clause) => {
    const column = table[clause.field]
    if (!column) throw new Error(`Unknown field "${clause.field}" on table`)
    switch (clause.operator ?? "eq") {
      case "eq":
        return eq(column, clause.value)
      case "ne":
        return ne(column, clause.value)
      case "gt":
        return gt(column, clause.value as any)
      case "gte":
        return gte(column, clause.value as any)
      case "lt":
        return lt(column, clause.value as any)
      case "lte":
        return lte(column, clause.value as any)
      case "in":
        return inArray(column, clause.value as any[])
      case "contains":
        return like(column, `%${clause.value}%`)
      case "starts_with":
        return like(column, `${clause.value}%`)
      case "ends_with":
        return like(column, `%${clause.value}`)
    }
  })
  const hasOr = where.some((clause) => clause.connector === "OR")
  return hasOr ? or(...conditions) : and(...conditions)
}

/**
 * Translates the generic `Adapter` contract into Drizzle queries against
 * the app's own `db`/schema - the app owns both, this just speaks the
 * common language every plugin codes against.
 */
export function drizzleAdapter(
  db: any,
  options: DrizzleAdapterOptions,
): Adapter {
  if (options.provider !== "sqlite")
    throw new Error(
      `drizzleAdapter: provider "${options.provider}" isn't implemented yet - only "sqlite" is`,
    )

  return {
    async create(input) {
      const table = resolveTable(options, input.model)
      const [row] = await db.insert(table).values(input.data).returning()
      return row
    },
    async findOne(input) {
      const table = resolveTable(options, input.model)
      const where = buildWhere(table, input.where)
      const row = await db.select().from(table).where(where).get()
      return row ?? null
    },
    async findMany(input) {
      const table = resolveTable(options, input.model)
      const where = buildWhere(table, input.where)
      let query = db.select().from(table)
      if (where) query = query.where(where)
      if (input.limit) query = query.limit(input.limit)
      return await query.all()
    },
    async update(input) {
      const table = resolveTable(options, input.model)
      const where = buildWhere(table, input.where)
      const [row] = await db
        .update(table)
        .set(input.data)
        .where(where)
        .returning()
      return row ?? null
    },
    async delete(input) {
      const table = resolveTable(options, input.model)
      const where = buildWhere(table, input.where)
      await db.delete(table).where(where)
    },
    async count(input) {
      const table = resolveTable(options, input.model)
      const where = buildWhere(table, input.where)
      const query = db.select().from(table)
      const rows = where ? await query.where(where).all() : await query.all()
      return rows.length
    },
  }
}
