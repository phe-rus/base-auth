// Same pattern as examples/playground/schema.ts: the app owns the actual
// schema, merging core's models with whichever plugins are enabled. Run
// `bun run db:gen` after changing plugins to produce a new migration.
//
// `drizzle-kit generate` introspects a schema module's exported bindings
// for tables, not the shape of a single object it's nested inside - so
// each table needs its own top-level named export, not just a `schema`
// object (that object is still exported below for convenience when
// constructing the `db`/adapter at runtime).
import { generateSqliteSchema } from "@base-auth/adapter-drizzle"
import { coreModels } from "@base-auth/core/adapter"
import { usernameModels } from "@base-auth/username"
import { roleModels } from "@base-auth/roles"

const generated = generateSqliteSchema({
  ...coreModels,
  ...usernameModels,
  ...roleModels,
})
export const { user, account, username, role } = generated
export const schema = generated
