export {
  /**
   * @deprecated
   * Use `import { createClient } from "@base-auth/core/client"` instead - it will tree shake better
   */
  createClient,
} from "./client.js"

export {
  /**
   * @deprecated
   * Use `import { createSubjects } from "@base-auth/core/subject"` instead - it will tree shake better
   */
  createSubjects,
} from "./subject.js"

import { issuer } from "./issuer.js"

export {
  /**
   * @deprecated
   * Use `import { issuer } from "@base-auth/core"` instead, it was renamed
   */
  issuer as authorizer,
  issuer,
}
