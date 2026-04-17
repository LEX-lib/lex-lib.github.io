import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import type { RecordModel } from "pocketbase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<RecordModel | null>(pb.authStore.record);

  const isLoggedIn = computed(() => !!user.value);

  pb.authStore.onChange(() => {
    user.value = pb.authStore.record;
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
