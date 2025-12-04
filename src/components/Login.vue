<script setup lang="ts">
import { ref, reactive } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { z } from 'zod';
import {Form, type FormSubmitEvent} from '@primevue/forms';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const remember = ref(false);

const login = async ( { valid, values } : FormSubmitEvent) => {
  if(!valid) return;

  try {
    await auth.login(values.email, values.password);

    // Determine safe redirect target
    const redirectRaw = route.query.redirect;
    let target = '/';
    if (typeof redirectRaw === 'string' && redirectRaw.startsWith('/')) {
      target = redirectRaw;
    }

    // Use replace so login is not kept in history
    await router.replace(target);
    console.log(auth.user);
  } catch (error) {
    // Handle login error (e.g., show error message)
    console.error('Login failed:', error);
  }
}

const initialValues = reactive({
  email: '',
  password: ''
});

const resolver = ref(zodResolver(
    z.object({
      //email: z.string().min(1, { message: 'Email is required.' }).email({ message: 'Invalid email address.' }),
      email: z.email({message: 'Invalid email address.'}).min(1, { message: 'Email is required.'}),//error : 'Invalid email address.'
      password: z.string().min(1, {message: 'Password is required.'})
    })
));
</script>

<template>
  <div class="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center p-4 login-bg">
    <div class="w-full max-w-md">
      <div class="relative rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
        <div class="absolute inset-0 rounded-2xl pointer-events-none" style="box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.25);"></div>
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-semibold text-black drop-shadow">Welcome back</h1>
          <p class="mt-1 text-black/80 text-sm">Sign in to continue</p>
        </div>

        <Form v-slot="$form" :initialValues :resolver @submit="login" class="space-y-5" validate-on-submit>
          <div class="flex flex-col gap-1">
            <FloatLabel variant="on">
              <InputText
                  name="email"
                  id="email"
                  autocomplete="email"
                  type="text"
                  fluid/>
              <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
                {{ $form.email.error?.message }}
              </Message>
              <label for="email">Email</label>
            </FloatLabel>
          </div>

          <div class="flex flex-col gap-1">
            <FloatLabel variant="on">
              <Password
                  name="password"
                  :feedback="false"
                  id="password"
                  fluid
                  toggleMask
                  autocomplete="password" />
              <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
                {{ $form.password.error?.message }}
              </Message>
              <label for="password">Password</label>
            </FloatLabel>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Checkbox input-id="remember" v-model="remember" :binary="true" />
              <label for="remember" class="text-sm text-black/90">Remember me</label>
            </div>
          </div>

          <Button type="submit" label="Sign in" icon="pi pi-sign-in" class="w-full" />
        </Form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Subtle gradient text helper if needed */
:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-checkbox),
:deep(.p-button) {
  /* Ensure frosted container vibes by lifting contrast inside glass */
}

.login-bg {
  background-image: radial-gradient(1200px 600px at 50% -20%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(800px 400px at 120% 20%, rgba(16, 185, 129, 0.12), transparent), radial-gradient(800px 400px at -20% 80%, rgba(59, 130, 246, 0.12), transparent);
}
</style>
