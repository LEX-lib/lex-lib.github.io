import PocketBase from "pocketbase";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const pb = new PocketBase(baseUrl);

// SSO: pick up a session written by the sibling delveen.cc app before this
// app's own router guards evaluate. loadFromCookie clears the store when the
// cookie is absent/unreadable, so only defer to it when there's no valid
// local session to protect — otherwise a missing cookie would log out a
// perfectly valid localStorage session on every refresh.
if (!pb.authStore.isValid) {
  pb.authStore.loadFromCookie(document.cookie);
}