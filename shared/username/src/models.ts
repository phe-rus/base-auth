import type { ModelDefinition } from "@base-auth/core/adapter"

export const usernameModels: Record<string, ModelDefinition> = {
  username: {
    fields: {
      id: { type: "string", required: true, unique: true },
      userId: {
        type: "string",
        required: true,
        unique: true,
        references: { model: "user", field: "id" },
      },
      username: { type: "string", required: true, unique: true },
      createdAt: { type: "date", required: true },
    },
  },
}
