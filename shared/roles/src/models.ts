import type { ModelDefinition } from "@base-auth/core/adapter"

export const roleModels: Record<string, ModelDefinition> = {
  role: {
    fields: {
      id: { type: "string", required: true, unique: true },
      userId: {
        type: "string",
        required: true,
        unique: true,
        references: { model: "user", field: "id" },
      },
      role: { type: "string", required: true },
      createdAt: { type: "date", required: true },
    },
  },
}
