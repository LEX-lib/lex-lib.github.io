import PocketBase from "pocketbase";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const pb = new PocketBase(baseUrl);
