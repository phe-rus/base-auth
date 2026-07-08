import { object, string } from "valibot"
import { createSubjects } from "@base-auth/core/subject"

export const subjects = createSubjects({
  user: object({
    id: string(),
  }),
})
