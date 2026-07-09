import { defineSchemaConfig } from "@base-auth/adapter-drizzle"
import { coreModels } from "@base-auth/core/adapter"
import { usernameModels } from "@base-auth/username"
import { roleModels } from "@base-auth/roles"

export default defineSchemaConfig({
  dialect: "sqlite",
  models: { ...coreModels, ...usernameModels, ...roleModels },
})
