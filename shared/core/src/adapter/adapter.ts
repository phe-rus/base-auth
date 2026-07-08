/**
 * The generic contract every storage backend implements and every plugin
 * codes against. This is deliberately ORM-agnostic - `@base-auth/core`
 * itself has no idea Drizzle (or Prisma, or Kysely) exists. Concrete
 * implementations (e.g. `@base-auth/adapter-drizzle`'s `drizzleAdapter`)
 * translate these calls against whatever schema the app owns.
 */
export type Operator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "contains"
  | "starts_with"
  | "ends_with"

export interface Where {
  field: string
  value: unknown
  /** @default "eq" */
  operator?: Operator
  /** @default "AND" */
  connector?: "AND" | "OR"
}

export interface Adapter {
  create<T>(input: { model: string; data: Record<string, unknown> }): Promise<T>
  findOne<T>(input: { model: string; where: Where[] }): Promise<T | null>
  findMany<T>(input: {
    model: string
    where?: Where[]
    limit?: number
  }): Promise<T[]>
  update<T>(input: {
    model: string
    where: Where[]
    data: Record<string, unknown>
  }): Promise<T | null>
  delete(input: { model: string; where: Where[] }): Promise<void>
  count(input: { model: string; where?: Where[] }): Promise<number>
}

/**
 * A declarative, dialect-agnostic description of a model's fields. Core
 * and plugins each contribute these so a generator (e.g.
 * `generateSqliteSchema`) can turn them into real tables in the app's own
 * schema - the fields a plugin needs exist without our packages owning
 * a fixed schema or migration path.
 */
export type FieldType = "string" | "number" | "boolean" | "date"

export interface FieldDefinition {
  type: FieldType
  required?: boolean
  unique?: boolean
  references?: { model: string; field: string }
}

export interface ModelDefinition {
  fields: Record<string, FieldDefinition>
}

export const coreModels: Record<string, ModelDefinition> = {
  user: {
    fields: {
      id: { type: "string", required: true, unique: true },
      createdAt: { type: "date", required: true },
      updatedAt: { type: "date", required: true },
    },
  },
  account: {
    fields: {
      id: { type: "string", required: true, unique: true },
      userId: {
        type: "string",
        required: true,
        references: { model: "user", field: "id" },
      },
      providerId: { type: "string", required: true },
      accountId: { type: "string", required: true },
      createdAt: { type: "date", required: true },
    },
  },
}
