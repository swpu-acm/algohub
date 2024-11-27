<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import * as api from '@/scripts/api';
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { useToast } from 'primevue';
import type { ProblemDetail } from '@/scripts/types';
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
const language = ref('rust');
const onSubmitCode = async (code: string, language: string) => {
    const res = await api.submitCode(id, {
        id: accountStore.account.id!,
        token: accountStore.account.token!,
        language,
        code,
    });
    if (!res.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Your code has been submitted successfully.' });
}

const path = ref<{ label?: string, link?: string }[]>([
    { label: 'fu050409' },
    { label: 'problem' },
    { label: id },
]);

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
        { label: problem.value?.owner.id }
    ]
    loading.value = false;
})
</script>

<template>
    <div class="flex-1 w-full flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <Splitter :gutterSize="2" class="flex-1 max-h-screen">
            <SplitterPanel>
                <Panel v-if="!loading" :header="problem?.title" class="w-full h-full overflow-auto">
                    <MdPreview :modelValue="formatProblem(problem!)" :theme="themeStore.dark ? 'dark' : 'light'"
                        codeTheme="github" previewTheme="github">
                    </MdPreview>
                </Panel>
            </SplitterPanel>
            <SplitterPanel class="flex flex-col">
                <MonacoEditor :code="code" :language="language" :onSubmitCode="onSubmitCode" class="h-full">
                </MonacoEditor>
                <div class="relative top-0 flex justify-end">
                    <Button @click="onSubmitCode(code, language)" label="Submit" class="mr-2"></Button>
                </div>
            </SplitterPanel>
        </Splitter>
    </div>
</template>
