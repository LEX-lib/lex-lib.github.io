import PocketBase from "pocketbase";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const pb = new PocketBase(baseUrl);

// SSO: pick up a session written by the sibling delveen.cc app before this
// app's own router guards evaluate.
pb.authStore.loadFromCookie(document.cookie);