import { describe, expect, it } from "vitest";
import { ClientResponseError } from "pocketbase";
import { authErrorMessage } from "@/lib/pocketbase/authErrors";

const G = "Sign in failed. Please try again.";

function responseError(status: number, message = "") {
  return new ClientResponseError({ status, response: { message } });
}

describe("authErrorMessage", () => {
  it("maps a network failure (status 0) to connectivity copy", () => {
    expect(authErrorMessage(responseError(0))).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
  });

  it("maps 400 to neutral bad-credentials copy (never exposes the raw message)", () => {
    expect(
      authErrorMessage(responseError(400, "Failed to authenticate.")),
    ).toBe("Incorrect email or password.");
  });

  it("maps 429 to a rate-limit message", () => {
    expect(authErrorMessage(responseError(429))).toBe(
      "Too many attempts. Please wait a minute and try again.",
    );
  });

  it("maps 403 to a neutral permission message (SDK default message never leaks)", () => {
    expect(authErrorMessage(responseError(403, "Account not verified."))).toBe(
      "You don't have permission to sign in.",
    );
  });

  it("maps 5xx to a server-fault message", () => {
    expect(authErrorMessage(responseError(500))).toBe(
      "Something went wrong on our end. Please try again shortly.",
    );
  });

  it("falls back to the generic message for non-PocketBase errors", () => {
    expect(authErrorMessage(new Error("boom"))).toBe(G);
    expect(authErrorMessage(undefined)).toBe(G);
  });
});
