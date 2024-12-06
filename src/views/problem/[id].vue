<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as api from '@/scripts/api';
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { useToast } from 'primevue';
import { Language, Submission, UserProblem } from '@/scripts/types';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { timeAgo } from '@/scripts/time';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const toast = useToast();
const accountStore = useAccountStore();
if (!accountStore.isLoggedIn) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Please login to access this page.' });
    router.push('/login');
}

const themeStore = useThemeStore();

const problem = ref<UserProblem>();
const formatProblem = (problem: UserProblem) => {
    let formattedText = '';
    const { description, input, output, samples, hint } = problem;

    description && (formattedText += `## Problem Description\n\n${description}\n\n`);
    input && (formattedText += `## Input\n\n${input}\n\n`);
    output && (formattedText += `## Output\n\n${output}\n\n`);
    if (samples) {
        formattedText += `## Samples\n\n`
        samples.forEach((sample, index) => {
            formattedText += `### Sample ${index + 1}\n\n`
            sample.input && (formattedText += "**Input:**\n\n```input\n" + sample.input + "\n```\n\n")
            sample.output && (formattedText += "**Output:**\n\n```output\n" + sample.output + "\n```\n\n")
        })
    }
    hint && (formattedText += `## Hint\n\n${hint}\n\n`);

    return formattedText;
}

const code = ref('');
const language = ref(Language.Rust);
const onSubmit = async (code: string, lang: Language, finish: (text: string, severity: string) => void) => {
    if (!code) {
        return finish('Code submission should not be a blank.', 'error')
    }
    if (!problem.value) {
        return finish('Failed to access problem data.', 'error')
    }
    const res = await api.submitCode(id, {
        auth: accountStore.auth!,
        lang,
        code,
    });
    if (!res.success) {
        return finish(res.message, 'error');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await togglePanel('records');
    finish('', 'info')
}

const path = ref<{ label?: string, link?: string }[]>([]);

const loading = ref(true);
onMounted(async () => {
    const res = await api.fetchProblem(id, {
        id: accountStore.account.id!,
        token: accountStore.account.token!
    });
    if (!res.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
    problem.value = res.data;
    path.value = [
        { label: problem.value?.owner.id, link: `/account/${problem.value?.owner.id}` },
        { label: problem.value?.title }
    ]
    loading.value = false;
})

const windowWidth = ref(window.innerWidth);
window.onresize = () => {
    windowWidth.value = window.innerWidth;
}

onUnmounted(() => {
    window.onresize = null;
})

const selectedPanel = ref('problem');

const togglePanel = async (panel: string) => {
    selectedPanel.value = panel;
    switch (panel) {
        case 'problem':
            break;
        case 'records':
            await fetchSubmissions();
            break;
    }
}

const records = ref<Submission[]>();
const loadingRecords = ref(false);
const fetchSubmissions = async () => {
    loadingRecords.value = true;
    const res = await api.listSubmissionsByProblemForAccount(
        problem.value!.id,
        accountStore.account!.id!,
        accountStore.auth!
    );
    if (!res.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
    records.value = res.data!;
    loadingRecords.value = false;
}
</script>

<template>
    <div class="flex flex-col h-screen">
        <UniversalToolBar :path></UniversalToolBar>
        <Splitter :gutterSize="2" class="h-full overflow-hidden"
            :layout="windowWidth > 768 ? 'horizontal' : 'vertical'">
            <SplitterPanel>
                <div class="flex flex-col gap-2 h-full">
                    <div class="p-3 flex flex-wrap flex-row items-center justify-between w-full"
                        v-if="problem?.creator === accountStore.account.id">
                        <Button size="small" icon="pi pi-arrow-left" plain outlined></Button>
                        <div class="inline-flex items-center gap-1">
                            <Button @click="router.push(`/problem/edit/${id}`)" icon="pi pi-pencil" size="small" plain
                                outlined></Button>
                            <Button size="small" severity="danger" icon="pi pi-trash" outlined></Button>
                        </div>
                    </div>
                    <div class="flex flex-row h-full overflow-auto">
                        <div class="flex flex-col w-20 gap-4">
                            <Button @click="togglePanel('problem')" pt:label:class="text-xs" label="Problem"
                                icon="pi pi-code" size="small" iconPos="top" plain text></Button>
                            <Button @click="togglePanel('records')" pt:label:class="text-xs" label="Records"
                                icon="pi pi-file" size="small" iconPos="top" plain text></Button>
                        </div>
                        <div v-if="selectedPanel === 'problem'" class="flex w-full h-full overflow-auto">
                            <MdPreview v-if="!loading" class="!bg-transparent" :modelValue="formatProblem(problem!)"
                                :theme="themeStore.dark ? 'dark' : 'light'" codeTheme="github" previewTheme="github">
                            </MdPreview>
                            <div v-else class="flex flex-col gap-4 m-3">
                                <Skeleton height="2em" width="12vw"></Skeleton>
                                <Skeleton height="5em" width="36vw"></Skeleton>
                                <Skeleton height="2em" width="27vw"></Skeleton>
                                <Skeleton height="10em" width="36vw"></Skeleton>
                            </div>
                        </div>
                        <div v-if="selectedPanel === 'records'" class="flex w-full h-full overflow-auto">
                            <DataView :value="records" dataKey="id" class="w-full h-full">
                                <template #header>
                                    <div class="inline-flex flex-wrap justify-end items-center gap-4 w-full">
                                        <Button size="small" icon="pi pi-refresh" @click="fetchSubmissions"
                                            :loading="loadingRecords"></Button>
                                    </div>
                                </template>
                                <template #empty>
                                    <div class="w-full h-full py-10 gap-4 flex flex-col items-center justify-center">
                                        <span class="text-xl text-gray-500">No record found.</span>
                                    </div>
                                </template>
                                <template v-if="loadingRecords" #list>
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
                                    <div v-for="(submission, index) in slotProps.items">
                                        <div class="flex flex-col items-start p-6 gap-3"
                                            :class="{ 'border-t border-zinc-200 dark:border-zinc-700': index !== 0 }">
                                            <div class="flex justify-center items-center gap-4 w-full">
                                                <div class="flex flex-row justify-between w-full">
                                                    <div class="flex flex-row gap-2">
                                                        <Avatar :image="accountStore.avatarUrl" shape="circle"></Avatar>
                                                        <div class="flex flex-col items-start">
                                                            <span class="text-sm">{{ accountStore.account.username
                                                                }}</span>
                                                            <span class="text-xs text-gray-500">Submitted {{
                                                                timeAgo(submission.created_at) }}</span>
                                                        </div>
                                                    </div>
                                                    <Badge :value="submission.lang" severity="info" size="small">
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div class="w-full flex flex-row justify-between items-center gap-4">
                                                Judge Status: {{ submission.status }}
                                            </div>
                                            <Message class="w-full" v-if="submission.status === 'ready'" size="large"
                                                :severity="submission.judge_result.status.type === 'accepted' ? 'success' : 'error'">
                                                {{
                                                    submission.judge_result.status.type }}</Message>
                                        </div>
                                    </div>
                                </template>
                            </DataView>
                        </div>
                    </div>
                </div>
            </SplitterPanel>
            <SplitterPanel>
                <MonacoEditor :code="code" :language="language" :onSubmit>
                </MonacoEditor>
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<style scoped>
:deep(.md-editor-preview-wrapper) {
    padding: 0 1em 0 1em;
}
</style>