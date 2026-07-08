import type { Adapter, Where } from "../src/adapter/adapter.js"

/**
 * Minimal in-memory Adapter, used to prove core logic (identity resolution,
 * plugin mounting) is genuinely ORM-agnostic - it doesn't reach for Drizzle
 * at all.
 */
export function FakeAdapter(): Adapter {
  const tables = new Map<string, Record<string, unknown>[]>()

  function rows(model: string) {
    if (!tables.has(model)) tables.set(model, [])
    return tables.get(model)!
  }

  function matches(row: Record<string, unknown>, where: Where[]) {
    return where.every((clause) => {
      const value = row[clause.field]
      switch (clause.operator ?? "eq") {
        case "eq":
          return value === clause.value
        case "ne":
          return value !== clause.value
        default:
          throw new Error(`FakeAdapter: unsupported operator ${clause.operator}`)
      }
    })
  }

  return {
    async create(input) {
      const row = { ...input.data }
      rows(input.model).push(row)
      return row as any
    },
    async findOne(input) {
      return (rows(input.model).find((row) => matches(row, input.where)) ??
        null) as any
    },
    async findMany(input) {
      const all = rows(input.model).filter((row) =>
        matches(row, input.where ?? []),
      )
      return (input.limit ? all.slice(0, input.limit) : all) as any
    },
    async update(input) {
      const row = rows(input.model).find((row) => matches(row, input.where))
      if (!row) return null
      Object.assign(row, input.data)
      return row as any
    },
    async delete(input) {
      const table = rows(input.model)
      const remaining = table.filter((row) => !matches(row, input.where))
      table.length = 0
      table.push(...remaining)
    },
    async count(input) {
      return rows(input.model).filter((row) =>
        matches(row, input.where ?? []),
      ).length
    },
  }
}
