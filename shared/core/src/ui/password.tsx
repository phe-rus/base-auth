/**
 * Configure the UI that's used by the Password provider.
 *
 * ```ts {1,7-12}
 * import { PasswordUI } from "@base-auth/core/ui/password"
 * import { PasswordProvider } from "@base-auth/core/provider/password"
 *
 * export default issuer({
 *   providers: {
 *     password: PasswordAdapter(
 *       PasswordUI({
 *         copy: {
 *           error_email_taken: "This email is already taken."
 *         },
 *         sendCode: (email, code) => console.log(email, code)
 *       })
 *     )
 *   },
 *   // ...
 * })
 * ```
 *
 * @packageDocumentation
 */
/** @jsxImportSource hono/jsx */

import {
  PasswordChangeError,
  PasswordConfig,
  PasswordLoginError,
  PasswordRegisterError,
} from "../provider/password.js"
import { Layout } from "./base.js"
import "./form.js"
import { FormAlert } from "./form.js"

/**
 * A password `<input>` with a show/hide toggle - the toggle button's click
 * handling lives in `Layout`'s vanilla-JS script (`base.tsx`, delegated
 * listener on `[data-toggle-password]`), not here, since this file never
 * runs client-side.
 */
function PasswordField(props: {
  name: string
  placeholder: string
  required?: boolean
  autofocus?: boolean
  autoComplete?: "current-password" | "new-password"
  value?: string
}) {
  return (
    <div data-component="input-group">
      <input data-component="input" type="password" {...props} />
      <button type="button" data-toggle-password aria-label="Show password">
        <svg
          data-slot="icon-eye"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
        <svg
          data-slot="icon-eye-off"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      </button>
    </div>
  )
}

const DEFAULT_COPY = {
  /**
   * Error message when email is already taken.
   */
  error_email_taken: "There is already an account with this email.",
  /**
   * Error message when the confirmation code is incorrect.
   */
  error_invalid_code: "Code is incorrect.",
  /**
   * Error message when the email is invalid.
   */
  error_invalid_email: "Email is not valid.",
  /**
   * Error message when the password is incorrect.
   */
  error_invalid_password: "Password is incorrect.",
  /**
   * Error message when the passwords do not match.
   */
  error_password_mismatch: "Passwords do not match.",
  /**
   * Error message when the user enters a password that fails validation.
   */
  error_validation_error: "Password does not meet requirements.",
  /**
   * Title of the register page.
   */
  register_title: "Welcome to the app",
  /**
   * Description of the register page.
   */
  register_description: "Sign in with your email",
  /**
   * Title of the login page.
   */
  login_title: "Welcome to the app",
  /**
   * Description of the login page.
   */
  login_description: "Sign in with your email",
  /**
   * Copy for the register button.
   */
  register: "Register",
  /**
   * Copy for the register link.
   */
  register_prompt: "Don't have an account?",
  /**
   * Copy for the login link.
   */
  login_prompt: "Already have an account?",
  /**
   * Copy for the login button.
   */
  login: "Login",
  /**
   * Copy for the forgot password link.
   */
  change_prompt: "Forgot password?",
  /**
   * Copy for the resend code button.
   */
  code_resend: "Resend code",
  /**
   * Copy for the "Back to" link.
   */
  code_return: "Back to",
  /**
   * Copy for the logo.
   * @internal
   */
  logo: "A",
  /**
   * Copy for the email input.
   */
  input_email: "Email",
  /**
   * Copy for the password input.
   */
  input_password: "Password",
  /**
   * Copy for the code input.
   */
  input_code: "Code",
  /**
   * Copy for the repeat password input.
   */
  input_repeat: "Repeat password",
  /**
   * Copy for the continue button.
   */
  button_continue: "Continue",
} satisfies {
  [
    key in `error_${
      | PasswordLoginError["type"]
      | PasswordRegisterError["type"]
      | PasswordChangeError["type"]}`
  ]: string
} & Record<string, string>

type PasswordUICopy = typeof DEFAULT_COPY

/**
 * Configure the password UI.
 */
export interface PasswordUIOptions extends Pick<
  PasswordConfig,
  "sendCode" | "sendResetCode" | "validatePassword" | "verify"
> {
  /**
   * Custom copy for the UI.
   */
  copy?: Partial<PasswordUICopy>
}

/**
 * Creates a UI for the Password provider flow.
 * @param input - Configure the UI.
 */
export function PasswordUI(input: PasswordUIOptions): PasswordConfig {
  const copy = {
    ...DEFAULT_COPY,
    ...input.copy,
  }
  return {
    validatePassword: input.validatePassword,
    sendCode: input.sendCode,
    sendResetCode: input.sendResetCode,
    verify: input.verify,
    login: async (_req, form, error): Promise<Response> => {
      const jsx = (
        <Layout>
          <form data-component="form" method="post">
            <FormAlert message={error?.type && copy?.[`error_${error.type}`]} />
            <input
              data-component="input"
              type="email"
              name="email"
              required
              placeholder={copy.input_email}
              autofocus={!error}
              value={form?.get("email")?.toString()}
            />
            <PasswordField
              autofocus={error?.type === "invalid_password"}
              required
              name="password"
              placeholder={copy.input_password}
              autoComplete="current-password"
            />
            <button data-component="button">{copy.button_continue}</button>
            <div data-component="form-footer">
              <span>
                {copy.register_prompt}{" "}
                <a data-component="link" href="register">
                  {copy.register}
                </a>
              </span>
              <a data-component="link" href="change">
                {copy.change_prompt}
              </a>
            </div>
          </form>
        </Layout>
      )
      return new Response(jsx.toString(), {
        status: error ? 401 : 200,
        headers: {
          "Content-Type": "text/html",
        },
      })
    },
    register: async (_req, state, form, error): Promise<Response> => {
      const emailError = ["invalid_email", "email_taken"].includes(
        error?.type || "",
      )
      const passwordError = [
        "invalid_password",
        "password_mismatch",
        "validation_error",
      ].includes(error?.type || "")
      const jsx = (
        <Layout>
          <form data-component="form" method="post">
            <FormAlert
              message={
                error?.type
                  ? error.type === "validation_error"
                    ? (error.message ?? copy?.[`error_${error.type}`])
                    : copy?.[`error_${error.type}`]
                  : undefined
              }
            />
            {state.type === "start" && (
              <>
                <input type="hidden" name="action" value="register" />
                <input
                  data-component="input"
                  autofocus={!error || emailError}
                  type="email"
                  name="email"
                  value={!emailError ? form?.get("email")?.toString() : ""}
                  required
                  placeholder={copy.input_email}
                />
                <PasswordField
                  autofocus={passwordError}
                  name="password"
                  placeholder={copy.input_password}
                  required
                  value={
                    !passwordError ? form?.get("password")?.toString() : ""
                  }
                  autoComplete="new-password"
                />
                <PasswordField
                  name="repeat"
                  required
                  autofocus={passwordError}
                  placeholder={copy.input_repeat}
                  autoComplete="new-password"
                />
                <button data-component="button">{copy.button_continue}</button>
                <div data-component="form-footer">
                  <span>
                    {copy.login_prompt}{" "}
                    <a data-component="link" href="authorize">
                      {copy.login}
                    </a>
                  </span>
                </div>
              </>
            )}

            {state.type === "code" && (
              <>
                <input type="hidden" name="action" value="verify" />
                <input
                  data-component="input"
                  autofocus
                  name="code"
                  minLength={6}
                  maxLength={6}
                  required
                  placeholder={copy.input_code}
                  autoComplete="one-time-code"
                />
                <button data-component="button">{copy.button_continue}</button>
              </>
            )}
          </form>
          {state.type === "code" && (
            <form method="post">
              <input type="hidden" name="action" value="register" />
              <div data-component="form-footer">
                <span>
                  {copy.code_return}{" "}
                  <a data-component="link" href="authorize">
                    {copy.login.toLowerCase()}
                  </a>
                </span>
                <button data-component="link">{copy.code_resend}</button>
              </div>
            </form>
          )}
        </Layout>
      ) as string
      return new Response(jsx.toString(), {
        headers: {
          "Content-Type": "text/html",
        },
      })
    },
    change: async (_req, state, form, error): Promise<Response> => {
      const passwordError = [
        "invalid_password",
        "password_mismatch",
        "validation_error",
      ].includes(error?.type || "")
      const jsx = (
        <Layout>
          <form data-component="form" method="post" replace>
            <FormAlert
              message={
                error?.type
                  ? error.type === "validation_error"
                    ? (error.message ?? copy?.[`error_${error.type}`])
                    : copy?.[`error_${error.type}`]
                  : undefined
              }
            />
            {state.type === "start" && (
              <>
                <input type="hidden" name="action" value="code" />
                <input
                  data-component="input"
                  autofocus
                  type="email"
                  name="email"
                  required
                  value={form?.get("email")?.toString()}
                  placeholder={copy.input_email}
                />
              </>
            )}
            {state.type === "code" && (
              <>
                <input type="hidden" name="action" value="verify" />
                <input
                  data-component="input"
                  autofocus
                  name="code"
                  minLength={6}
                  maxLength={6}
                  required
                  placeholder={copy.input_code}
                  autoComplete="one-time-code"
                />
              </>
            )}
            {state.type === "update" && (
              <>
                <input type="hidden" name="action" value="update" />
                <PasswordField
                  autofocus
                  name="password"
                  placeholder={copy.input_password}
                  required
                  value={
                    !passwordError ? form?.get("password")?.toString() : ""
                  }
                  autoComplete="new-password"
                />
                <PasswordField
                  name="repeat"
                  required
                  value={
                    !passwordError ? form?.get("password")?.toString() : ""
                  }
                  placeholder={copy.input_repeat}
                  autoComplete="new-password"
                />
              </>
            )}
            <button data-component="button">{copy.button_continue}</button>
          </form>
          {state.type === "code" && (
            <form method="post">
              <input type="hidden" name="action" value="code" />
              <input type="hidden" name="email" value={state.email} />
              {state.type === "code" && (
                <div data-component="form-footer">
                  <span>
                    {copy.code_return}{" "}
                    <a data-component="link" href="authorize">
                      {copy.login.toLowerCase()}
                    </a>
                  </span>
                  <button data-component="link">{copy.code_resend}</button>
                </div>
              )}
            </form>
          )}
        </Layout>
      )
      return new Response(jsx.toString(), {
        status: error ? 400 : 200,
        headers: {
          "Content-Type": "text/html",
        },
      })
    },
  }
}
