<script setup lang="ts">
import * as api from "@/scripts/api";
import { useAccountStore, useThemeStore } from "@/scripts/store";
import { timeAgo } from "@/scripts/time";
import { ProblemDetail, type Profile } from "@/scripts/types";
import { expandUrl } from "@/scripts/utils";
import { useToast } from "primevue";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const accountStore = useAccountStore();
const themeStore = useThemeStore();

const id = route.params.id as string;
const tab = ref<string>('overview');
const path = ref<{ label: string; link: string; }[]>([]);

const profile = ref<Profile>();

const items = ref([
    { tab: 'overview', label: 'Overview', icon: 'pi pi-desktop' },
    { tab: 'problems', label: 'Problems', icon: 'pi pi-book' },
]);

const toggleTab = async (to: string) => {
    router.push(`/account/${id}?tab=${to}`);
    tab.value = to;
    switch (to) {
        case 'overview':
            break;
        case 'problems':
            await onProblemTab();
            break;
    }
}

const problemList = ref<ProblemDetail[]>([]);
problemList.value.length = 1;

const loadingProblems = ref(true);
const onProblemTab = async () => {
    loadingProblems.value = true;
    const res = await api.listProblems({
        identity: profile.value!.username,
        auth: accountStore.auth
    });
    if (!res.success) {
        return toast.add({ severity: "error", summary: "Error", detail: res.message });
    }
    problemList.value = res.data!;
    loadingProblems.value = false;
}

watch(() => route.query.tab, async (newTab) => {
    if (newTab !== undefined) {
        await toggleTab(newTab as string);
    } else {
        await toggleTab('overview');
    }
})

const loading = ref(true);
onMounted(async () => {
    const res = await api.fetchProfile(id);
    if (!res.success) {
        return toast.add({ severity: "error", summary: "Error", detail: res.message });
    }
    profile.value = res.data;
    path.value = [
        { label: profile.value!.username, link: `/account/${id}` }
    ]
    loading.value = false;
    await toggleTab(route.query.tab as string || 'overview');
})
</script>

<template>
    <div class="w-full h-full flex flex-col">
        <UniversalToolBar :path :separateBottom="false"></UniversalToolBar>
        <div class="w-full flex-1">
            <Tabs :value="tab || 'overview'">
                <TabList pt:tabList:class="!bg-gray-100 dark:!bg-zinc-900 px-5">
                    <Tab class="!py-2" v-for="tab in items" :key="tab.label" :value="tab.tab"
                        @click="toggleTab(tab.tab)">
                        <a v-ripple class="flex items-center gap-2 text-inherit">
                            <i :class="tab.icon"></i>
                            <span>{{ tab.label }}</span>
                        </a>
                    </Tab>
                </TabList>
                <TabPanel :value="tab" as="div" class="h-full w-full flex justify-center mx-auto">
                    <div class="w-full max-w-[1200px] flex flex-col md:flex-row my-[2em] gap-6 mx-8">
                        <div v-if="!loading && profile" class="flex flex-col h-full">
                            <div class="flex gap-4 sm:flex-col sm:gap-1">
                                <img class="w-[8em] h-[8em] sm:w-[18em] sm:h-[18em] rounded-full border-[2px] border-zinc-300 dark:border-zinc-700"
                                    :src="expandUrl(profile!.avatar)"></img>
                                <div class="flex flex-col items-start justify-center">
                                    <h3 class="text-2xl font-bold">{{ profile.nickname }}</h3>
                                    <span class="text-lg text-gray-500">{{ profile.username }} · {{ profile.sex ?
                                        'he/him' : 'she/her' }}</span>
                                </div>
                            </div>
                            <span class="my-1">{{ profile.signature }}</span>
                            <Button class="my-4" size="small" v-if="accountStore.account.username === profile.username"
                                label="Edit Profile" severity="secondary" disabled fluid></Button>
                            <div class="flex flex-col gap-2 my-2">
                                <div class="inline-flex items-center gap-2">
                                    <i class="pi pi-envelope text-gray-500"></i>
                                    <span>{{ profile.email }}</span>
                                </div>
                                <div class="inline-flex items-center gap-2">
                                    <i class="pi pi-building text-gray-500"></i>
                                    <span>{{ profile.school }}</span>
                                </div>
                                <div class="inline-flex items-center gap-2">
                                    <i class="pi pi-building-columns text-gray-500"></i>
                                    <span>{{ profile.college }}</span>
                                </div>
                                <div class="inline-flex items-center gap-2">
                                    <i class="pi pi-graduation-cap text-gray-500"></i>
                                    <span>{{ profile.major }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 h-full w-full">
                            <Panel v-if="tab === 'overview' && !loading" header="Profile"
                                class="border dark:border-zinc-600">
                                <div class="py-8 flex flex-col gap-4 justify-center items-center">
                                    <Knob :size="300" v-model="profile!.rating" readonly />
                                    <span class="text-3xl text-gray-500">Rating</span>
                                </div>
                            </Panel>

                            <Panel v-if="tab === 'problems'" pt:header:class="!hidden" pt:content:class="!p-[1.125rem]">
                                <DataView :value="problemList" dataKey="id">
                                    <template #header>
                                        <div class="inline-flex flex-wrap justify-between items-center gap-4 w-full">
                                            <InputText placeholder="Find a problem..." size="small" disabled>
                                            </InputText>
                                            <Button @click="router.push('/problem/create')" label="New" size="small"
                                                icon="pi pi-book"></Button>
                                        </div>
                                    </template>
                                    <template #empty>
                                        <div
                                            class="w-full h-full py-10 gap-4 flex flex-col items-center justify-center">
                                            <img class="w-[16em] h-[16em]" :src="themeStore.logo"></img>
                                            <span class="text-xl text-gray-500">No Problems yet, <a
                                                    class="underline cursor-pointer"
                                                    @click="router.push('/problem/create')">Create one?</a></span>
                                        </div>
                                    </template>
                                    <template v-if="loadingProblems" #list>
                                        <div v-for="i in 3" :key="i">
                                            <div class="flex flex-col items-start p-6 gap-3"
                                                :class="{ 'border-t border-zinc-200 dark:border-zinc-700': i !== 0 }">
                                                <Skeleton height="2em" width="10em"></Skeleton>
                                                <Skeleton></Skeleton>
                                                <Skeleton width="3em"></Skeleton>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-else #list="slotProps">
                                        <div v-for="(problem, index) in slotProps.items">
                                            <div class="flex flex-col items-start p-6 gap-3"
                                                :class="{ 'border-t border-zinc-200 dark:border-zinc-700': index !== 0 }">
                                                <!-- Should add problem sequence later -->
                                                <div class="flex items-center gap-4">
                                                    <h2 @click="router.push('/problem/' + problem.id)"
                                                        class="font-bold text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">
                                                        {{ problem.title }}</h2>
                                                    <Badge severity="secondary">{{ problem.private ? 'Private' :
                                                        'Public' }}
                                                    </Badge>
                                                </div>
                                                <span class="text-sm">{{ timeAgo(problem.updated_at) }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </DataView>
                            </Panel>
                        </div>
                    </div>
                </TabPanel>
            </Tabs>
        </div>
    </div>
</template>

<style scoped></style>