<script setup lang="ts">
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { onMounted, ref } from 'vue';
import * as api from '@/scripts/api';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue';
import { ProblemDetail } from '@/scripts/types';

const path = [{ label: 'Dashboard' }];

const router = useRouter();
const toast = useToast();

const accountStore = useAccountStore();
if (!accountStore.isLoggedIn) {
    toast.add({ severity: 'info', summary: 'Login Required', detail: 'Please login first', life: 3000 });
    router.push("/login");
}

const themeStore = useThemeStore();

const problemList = ref<ProblemDetail[]>([]);

const loadingProfile = ref(true);
const loadingProblems = ref(true);
onMounted(async () => {
    if (!accountStore.isLoggedIn) return;
    const profile = await api.fetchProfile(accountStore.account.id!);
    if (!profile.success) {
        accountStore.logout();
        return toast.add({ severity: 'error', summary: 'Error', detail: profile.message, life: 3000 });
    }
    accountStore.mergeProfile(profile.data!);
    loadingProfile.value = false;
    const problems = await api.listProblems({
        identity: accountStore.account.id!,
        auth: {
            id: accountStore.account.id!,
            token: accountStore.account.token!
        },
        limit: 5,
    });
    if (!problems.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: problems.message, life: 3000 });
    }
    problemList.value = problems.data!;
    loadingProblems.value = false;
})
</script>

<template>
    <div class="h-screen flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <div class="flex flex-col md:flex-row h-full w-full">
            <aside class="w-full md:w-1/3 lg:w-1/4 flex">
                <div
                    class="w-full bg-zinc-100 dark:bg-zinc-800 md:sticky md:top-0 md:bottom-0 z-30 flex flex-col md:border-r-[1.5px] dark:border-zinc-700">
                    <div class="flex flex-col top-0 px-4 overflow-auto">
                        <div v-if="!loadingProfile" class="inline-flex m-8 mb-3 gap-8 items-center">
                            <Avatar :image="accountStore.avatarUrl" shape="circle"></Avatar>
                            <span>{{ accountStore.account?.username }}</span>
                        </div>
                        <div v-else class="inline-flex m-8 mb-3 gap-8 items-center">
                            <Skeleton shape="circle" size="2rem"></Skeleton>
                            <Skeleton width="6rem" borderRadius="16px"></Skeleton>
                        </div>
                        <Divider></Divider>
                        <div class="flex flex-col flex-1 items-center">
                            <div class="flex flex-col gap-2 justify-between items-center w-full px-6">
                                <div class="flex flex-row items-center justify-between w-full">
                                    <h3 class="text-sm font-bold">Your Problems</h3>
                                    <Button @click="router.push('/problem/create')" icon="pi pi-book" label="New"
                                        size="small"></Button>
                                </div>
                                <div class="flex flex-col items-center mb-4 w-full">
                                    <div class="flex flex-col gap-3 w-full justify-start">
                                        <div v-if="loadingProblems" class="my-5 flex flex-col gap-2">
                                            <Skeleton class="w-full" height="20px"></Skeleton>
                                            <Skeleton class="w-full" height="20px"></Skeleton>
                                            <Skeleton class="w-full" height="20px"></Skeleton>
                                        </div>
                                        <div v-else-if="problemList.length === 0"
                                            class="w-full my-5 flex flex-col items-center text-gray-500 text-sm text-center">
                                            <span>No problems found,</span>
                                            <span>
                                                consider <a class="underline cursor-pointer"
                                                    @click="router.push('/problem/create')">create a
                                                    new one</a>?
                                            </span>
                                        </div>
                                        <div v-else class="flex flex-col gap-2 my-3">
                                            <div v-for="problem in problemList" class="inline-flex gap-3 items-center">
                                                <img :src="accountStore.avatarUrl" class="w-5 h-5 rounded"></img>
                                                <a @click="router.push('/problem/' + problem.id)"
                                                    class="cursor-pointer text-xs font-bold hover:underline">{{
                                                        problem.id }}</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
