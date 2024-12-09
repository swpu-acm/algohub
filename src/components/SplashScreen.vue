<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as api from "@/scripts/api";
import { useAccountStore } from '@/scripts/store';
import { useRouter } from 'vue-router';

const loading = defineModel<boolean>({ required: true })

const router = useRouter();

const texts = [
    "Welcome to AlgoHub",
    "Be true to your true self, not to your ego. Choose the normalcy, not human kind. \
Believe in civilization, not humanity."
]
const index = ref(0);
const status = ref("Loading...");
const onChange = () => {
    index.value = (index.value + 1) % texts.length;
}
const accountStore = useAccountStore();

export interface LatestVersions {
    nightly?: string;
    stable?: string;
    alpha?: string;
    beta?: string;
    rc?: string;
    status: boolean;
}

onMounted(async () => {
    status.value = "Checking for updates...";
    try {
        const { invoke } = (await import('@tauri-apps/api/core'));
        const versions: LatestVersions = await invoke("get_latest_versions");
        if (!versions.status) {
            status.value = "Failed to get latest versions, skipping update check..."
        } else {
            if (versions.beta) {
                status.value = `New beta version available: ${versions.beta}`;
            } else {
                status.value = `The latest alpha version is: ${versions.alpha}, no available updates.`
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (e) {
        console.error(e);
        status.value = "Tauri API not found, skipping update check..."
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    status.value = "Checking for login...";
    if (accountStore.isLoggedIn) {
        const res = await api.verifyToken(accountStore.auth);
        if (!res.success) {
            accountStore.logout();
            status.value = "User credentials expired. Consider login again.";
            await new Promise(resolve => setTimeout(resolve, 3000));
            loading.value = false;
            router.push('/login')
        } else {
            loading.value = false;
            router.push('/dashboard')
        }
    }
    loading.value = false;
})
</script>

<template>
    <div @click="onChange" class="bg-gray-900 flex flex-col items-center justify-center h-full w-full">
        <div class="flex flex-col items-center justify-center h-full w-full max-w-[700px] gap-[2em]">
            <div class="flex flex-col items-center justify-center">
                <img src="/acm-light.png" class="w-48" />
                <div class=" text-white text-center font-bold text-4xl w-full">AlgoHub
                </div>
            </div>
            <div class="flex flex-col gap-3 justify-center w-full px-20">
                <div class="text-sm mb-5">{{ texts[index] }}</div>
                <ProgressBar mode="indeterminate" class="w-full !h-[5px]"></ProgressBar>
                <div class="text-gray-500 text-right font-bold text-sm">{{ status }}</div>
            </div>
        </div>
        <div class="flex flex-col text-center w-full text-xs mb-10">
            <span>Copyright © 2006-present ACM-SWPU. All rights reserved.</span>
        </div>
    </div>
</template>