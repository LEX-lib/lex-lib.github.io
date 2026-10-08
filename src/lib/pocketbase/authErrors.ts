import { ClientResponseError } from "pocketbase";

const GENERIC = "Sign in failed. Please try again.";

/**
 * Map a PocketBase auth failure to short, user-facing copy for the login toast.
 * Kept generic on purpose — never reveal whether an email exists. See
 * `__tests__/authErrors.spec.ts` for the covered cases.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    switch (error.status) {
      case 0:
        return "Can't reach the server. Check your connection and try again.";
      case 400:
        // PocketBase returns 400 "Failed to authenticate." for a wrong
        // email/password, so surface neutral copy instead of the raw message.
        return "Incorrect email or password.";
      case 403:
        return "You don't have permission to sign in.";
      case 429:
        return "Too many attempts. Please wait a minute and try again.";
      default:
        return error.status >= 500
          ? "Something went wrong on our end. Please try again shortly."
          : error.message || GENERIC;
    }
  }
  return GENERIC;
}
