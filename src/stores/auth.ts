import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import type { RecordModel } from "pocketbase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<RecordModel | null>(pb.authStore.record);

  const isLoggedIn = computed(() => !!user.value);

  pb.authStore.onChange(() => {
    user.value = pb.authStore.record;

    // SSO: mirror the token into a cookie scoped to .delveen.cc so the
    // sibling app picks up login/logout on its next load or navigation.
    document.cookie = pb.authStore.exportToCookie({
      domain: ".delveen.cc",
      secure: true,
      sameSite: "Lax",
      path: "/",
      // exportToCookie defaults httpOnly:true; document.cookie writes with
      // HttpOnly are silently dropped by the browser (only a server
      // Set-Cookie header can set that flag), so no cookie ever appeared.
      httpOnly: false,
    });
  });

  async function login(email: string, password: string) {
    await pb.collection("users").authWithPassword(email, password);
  }
  //
  // async function signup(email, password, passwordConfirm, name) {
  //     await pb.collection('users').create({
  //         email,
  //         password,
  //         passwordConfirm,
  //         name,
  //     });
  //     // Optional: log them in immediately after signup
  //     await login(email, password);
  // }
  //
  function logout() {
    pb.authStore.clear();
  }

  return { user, isLoggedIn, login, logout }; //, signup, logout
});
