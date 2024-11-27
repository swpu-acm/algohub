<script setup lang="ts">
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { onMounted, ref } from 'vue';
import * as api from '@/scripts/api';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue';

const path = [{ label: 'Dashboard' }];

const router = useRouter();
const toast = useToast();

const accountStore = useAccountStore();
if (!accountStore.isLoggedIn) {
    toast.add({ severity: 'info', summary: 'Login Required', detail: 'Please login first', life: 3000 });
    router.push("/login");
}

const themeStore = useThemeStore();

const loadingProfile = ref(true);
onMounted(async () => {
    if (!accountStore.isLoggedIn) return;
    const response = await api.fetchProfile(accountStore.account.id!);
    if (!response.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: response.message });
    }
    accountStore.mergeProfile(response.data!);
    loadingProfile.value = false;
})
</script>

<template>
    <div class="flex-1 min-h-screen h-screen flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <div class="flex flex-col md:flex-row h-full w-full">
            <aside class="w-full md:w-1/3 lg:w-1/4 flex">
                <div
                    class="w-full bg-zinc-50 dark:bg-zinc-800 md:sticky md:top-0 md:bottom-0 z-30 flex flex-col min-h-50vh max-h-screen">
                    <div class="flex flex-col top-0 px-4 overflow-auto">
                        <div v-if="!loadingProfile" class="inline-flex m-8 mb-3 gap-8 items-center">
                            <Avatar :image="accountStore.avatarUrl" shape="circle"></Avatar>
                            <span>{{ accountStore.account?.username }}</span>
                        </div>
                        <div v-if="loadingProfile" class="inline-flex m-8 mb-3 gap-8 items-center">
                            <Skeleton shape="circle" size="2rem"></Skeleton>
                            <Skeleton width="6rem" borderRadius="16px"></Skeleton>
                        </div>
                        <Divider></Divider>
                        <div class="flex flex-col flex-1">
                            <div class="flex flex-col items-center mb-4">
                                <Image :src="themeStore.logo"></Image>
                                <span>Coming soon...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
            <div class="w-full h-full flex-1">
                <div class="flex flex-col items-center mb-4">
                    <Image :src="themeStore.logo"></Image>
                    <span>Coming soon...</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
