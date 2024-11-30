<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import * as api from '@/scripts/api';
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { useToast } from 'primevue';
import { Language, ProblemDetail } from '@/scripts/types';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const route = useRoute();
const id = route.params.id as string;

const toast = useToast();
const accountStore = useAccountStore();
const themeStore = useThemeStore();

const problem = ref<ProblemDetail>();
const formatProblem = (problem: ProblemDetail) => {
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
    finish('Code submitted', 'success');
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
</script>

<template>
    <div class="flex flex-col h-full">
        <UniversalToolBar :path></UniversalToolBar>
        <Splitter :gutterSize="2" class="flex-1 overflow-hidden">
            <SplitterPanel>
                <Panel class="w-full h-full overflow-auto">
                    <MdPreview v-if="!loading" class="!bg-transparent" :modelValue="formatProblem(problem!)"
                        :theme="themeStore.dark ? 'dark' : 'light'" codeTheme="github" previewTheme="github">
                    </MdPreview>
                    <div v-else class="flex flex-col gap-4 m-3">
                        <Skeleton height="2em" width="15vw"></Skeleton>
                        <Skeleton height="5em" width="40vw"></Skeleton>
                        <Skeleton height="2em" width="30vw"></Skeleton>
                        <Skeleton height="10em" width="40vw"></Skeleton>
                    </div>
                </Panel>
            </SplitterPanel>
            <SplitterPanel>
                <MonacoEditor :code="code" :language="language" :onSubmit>
                </MonacoEditor>
            </SplitterPanel>
        </Splitter>
    </div>
</template>
