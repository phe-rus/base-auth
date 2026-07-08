import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import type { FieldDefinition, ModelDefinition } from "@base-auth/core/adapter"

export interface GenerateSqliteSchemaOptions {
  /** @default false */
  usePlural?: boolean
  /** Naming convention for generated DB columns. @default "snake_case" */
  columnCase?: "snake_case" | "camelCase"
}

function toSnakeCase(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function columnName(key: string, columnCase: "snake_case" | "camelCase") {
  return columnCase === "camelCase" ? key : toSnakeCase(key)
}

function buildColumn(
  fieldName: string,
  field: FieldDefinition,
  columnCase: "snake_case" | "camelCase",
  tables: Record<string, any>,
) {
  const name = columnName(fieldName, columnCase)
  let column: any
  switch (field.type) {
    case "string":
      column = text(name)
      break
    case "number":
      column = integer(name)
      break
    case "boolean":
      column = integer(name, { mode: "boolean" })
      break
    case "date":
      column = integer(name, { mode: "timestamp_ms" })
      break
  }
  if (fieldName === "id") column = column.primaryKey()
  else {
    if (field.required) column = column.notNull()
    // a primary key is already implicitly unique - skip the redundant index
    if (field.unique) column = column.unique()
  }
  if (field.references) {
    const ref = field.references
    column = column.references(() => tables[ref.model][ref.field])
  }
  return column
}

/**
 * Turns declarative `ModelDefinition`s (contributed by core + whichever
 * plugins are enabled) into real Drizzle SQLite table objects. This is the
 * "auto generate" story: the app imports this into its *own* `schema.ts`,
 * commits the result, and runs its own `drizzle-kit generate`/`migrate`
 * against it - the schema lives in the app's project, not hidden in this
 * package.
 *
 * Return type is intentionally loose (`Record<string, any>`) - full type
 * inference the way hand-written Drizzle schemas get isn't preserved for
 * dynamically generated tables.
 */
export function generateSqliteSchema(
  models: Record<string, ModelDefinition>,
  opts: GenerateSqliteSchemaOptions = {},
): Record<string, any> {
  const columnCase = opts.columnCase ?? "snake_case"
  const usePlural = opts.usePlural ?? false
  const tables: Record<string, any> = {}

  for (const [modelName, model] of Object.entries(models)) {
    const tableName = usePlural ? `${modelName}s` : modelName
    const columns: Record<string, any> = {}
    for (const [fieldName, field] of Object.entries(model.fields)) {
      columns[fieldName] = buildColumn(fieldName, field, columnCase, tables)
    }
    tables[modelName] = sqliteTable(tableName, columns)
  }

  return tables
}
