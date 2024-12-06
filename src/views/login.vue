<script setup lang="ts">
import { reactive, ref, type Ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { useRouter } from "vue-router";
import { useAccountStore, useThemeStore } from "@/scripts/store";
import * as api from "@/scripts/api";

const toast = useToast();
const router = useRouter();
const accountStore = useAccountStore();
const themeStore = useThemeStore();

if (accountStore.isLoggedIn) {
  router.push('/dashboard');
}

const initialValues = reactive({
  identity: '',
  password: '',
  terms: false,
});

interface LoginForm<T> {
  identity?: T;
  password?: T;
  terms?: T;
}

const resolver = ({ values }: { values: LoginForm<string> }) => {
  const errors: LoginForm<{ message: string }[]> = {};

  if (!values.identity) {
    errors.identity = [{ message: 'Please enter your username or email.' }];
  }

  if (!values.password) {
    errors.password = [{ message: 'Missing password.' }];
  }

  if (!values.terms) {
    errors.terms = [{ message: 'You must agree to the terms and conditions.' }];
  }

  return { errors };
};

const inProgress = ref(false);
const onLogin = async ({ valid, states }: { valid: boolean, states: LoginForm<Ref<string>> }) => {
  if (!valid) return;

  inProgress.value = true;

  const { identity, password } = states;
  const res = await api.login({ identity: identity?.value!, password: password?.value! });

  if (!res.success) {
    toast.add({ severity: 'error', summary: 'Login Failed', detail: res.message, life: 3000 });
  } else {
    accountStore.mergeProfile(res.data!);
    toast.add({ severity: 'success', summary: 'Login Success', detail: 'Welcome back!', life: 3000 });
    router.push('/dashboard');
  }

  inProgress.value = false;
}
</script>

<template>
  <div class="flex flex-row h-full">
    <div class="hidden md:flex flex-col items-center justify-center h-full w-full">
      <div class="flex flex-1 flex-col items-center justify-center w-full h-full">
        <Image class="hidden md:flex" :src="themeStore.dark ? '/acm-light.png' : '/acm.png'" alt="Image" width="250" />
        <h1 class="text-3xl md:text-4xl font-bold mt-6 md:m-0">ACM Algorithm Hub</h1>
      </div>
      <footer class="flex flex-row items-start w-full">
        <Button @click="themeStore.toggle" :icon="`pi pi-${themeStore.dark ? 'moon' : 'sun'}`" plain text></Button>
      </footer>
    </div>
    <div class="flex w-full ">
      <Card class="m-auto flex basis-[40rem] w-full h-full items-center justify-center flex-col">
        <template #header>
          <Button @click="themeStore.toggle" class="md:!hidden" :icon="`pi pi-${themeStore.dark ? 'moon' : 'sun'}`"
            plain text></Button>
        </template>
        <template #title>Welcome to ACM Algorithm Hub</template>
        <template #subtitle>Association of Computing Machinery affiliated with SWPU</template>
        <template #content>
          <Form v-slot="$form" :initialValues :resolver @submit="onLogin"
            class="flex flex-col p-6 gap-4 items-center justify-center">
            <div class="flex flex-col gap-1 w-full">
              <InputText name="identity" type="text" placeholder="Username or Email" fluid />
              <Message v-if="$form.identity?.invalid" severity="error" size="small" variant="simple">{{
                $form.identity.error.message }}</Message>
            </div>
            <div class="flex flex-col gap-1 w-full">
              <Password name="password" type="text" placeholder="Password" :feedback="false" toggleMask fluid />
              <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{
                $form.password.error.message }}</Message>
            </div>
            <div class="flex flex-col gap-1 w-full">
              <div class="flex items-center gap-2">
                <Checkbox inputId="terms" name="terms" binary />
                <label for="terms" class="text-sm">I have read and agree to the <a href="#" class="underline">Affero
                    General Public License v3</a>.</label>
              </div>
              <Message v-if="$form.terms?.invalid" severity="error" size="small" variant="simple">{{
                $form.terms.error.message }}</Message>
            </div>
            <p>Do not have an account? <a @click="router.push('/signup')" class="underline">Sign up</a></p>
            <Button type="submit" label="Login" class="w-full" secondary :loading="inProgress"></Button>
          </Form>
        </template>
      </Card>
    </div>
  </div>
</template>
