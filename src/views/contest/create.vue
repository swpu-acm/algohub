<script setup lang="ts">
import { type FileUploadSelectEvent, usePrimeVue, useToast } from 'primevue';
import { computed, reactive, ref } from 'vue';
import * as api from "@/scripts/api";
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/scripts/store';
import type { RecordId } from '@/scripts/types';

const path = [{ label: 'New problem' }];

const router = useRouter();
const toast = useToast();
const $primevue = usePrimeVue();

const accountStore = useAccountStore();
if (!accountStore.isLoggedIn) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Please login first', life: 3000 });
    router.push('/login');
}

const title = ref('');
const description = ref('');
const input = ref('');
const output = ref('');
const samples = reactive<{ input: string, output: string }[]>([{ input: '', output: '' }]);
const hint = ref('');
const mode = ref<'ICPC' | 'OI'>('ICPC');
const isPrivate = ref(false);
const testCases = reactive<{ input: string, output: string }[]>([]);

const timeLimit = ref<number>(1000);
const memoryLimit = ref<number>(128);

interface ProblemForm<T, N> {
    title: T;
    description: T;
    input?: T;
    output?: T;
    samples: { input: T, output: T }[];
    hint?: T;
    time_limit: N;
    memory_limit: N;
    test_cases: { input: T, output: T }[];
    owner: RecordId,
    categories: string[];
    tags: string[];
    mode: 'ICPC' | 'OI';
    private: boolean;
}

const validate = (form: ProblemForm<string, number>): boolean => {
    if (!form.title || form.title.trim() === '') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Title should not be a blank', life: 3000 });
        return false;
    } else if (form.title.length > 32) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Title is too long (max 32 characters)', life: 3000 });
        return false;
    }
    if (!form.description || form.description.trim() === '') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Description should not be a blank', life: 3000 });
        return false;
    } else if (form.description.length > 2000) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Description is too long (max 2000 characters)', life: 3000 });
        return false;
    }
    return true;
}

const inProgress = ref(false);
const onCreateProblem = async () => {
    const problem: ProblemForm<string, number> = {
        title: title.value,
        description: description.value,
        input: input.value || undefined,
        output: output.value || undefined,
        samples: samples.map(sample => ({ input: sample.input, output: sample.output })),
        hint: hint.value || undefined,
        time_limit: timeLimit.value,
        memory_limit: memoryLimit.value,
        test_cases: testCases.map(tc => ({ input: tc.input, output: tc.output })),
        // @ts-ignore
        owner: "account:" + accountStore.account.id,
        categories: [],
        tags: [],
        mode: mode.value,
        private: isPrivate.value
    }
    const valid = validate(problem);
    if (!valid) return;

    if (inProgress.value) return;
    inProgress.value = true;
    const res = await api.createProblem({
        id: accountStore.account.id!,
        token: accountStore.account.token!,
        ...problem,
    });
    if (!res.success) {
        inProgress.value = false;
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message, life: 3000 });
    }
    inProgress.value = false;
    router.push(`/problem/${res.data!.id}`);
}

const totalSize = ref(0);
const totalUploadedSize = ref(0);
const totalSizePercent = computed(() => (totalUploadedSize.value / totalSize.value) * 100);
const normalizedFiles = ref<{ input?: File, output?: File }[]>([]);

const onRemoveTemplatingFile = (
    type: 'input' | 'output',
    context: {
        removeFileCallback: (index: number) => void,
        plainFiles: File[],
        normalizedIndex: number,
    }
) => {
    const testCase = normalizedFiles.value[context.normalizedIndex];
    const fileRemoved = type === 'input' ? testCase.input! : testCase.output!;
    testCase[type] = undefined;
    if (!testCase.input && !testCase.output) {
        normalizedFiles.value.splice(context.normalizedIndex, 1);
    }
    context.removeFileCallback(context.plainFiles.indexOf(fileRemoved));
    totalSize.value -= parseInt(formatSize(fileRemoved.size));
    return true;
};

const onClearTemplatingUpload = (clear: () => void) => {
    clear();
    totalSize.value = 0;
    totalUploadedSize.value = 0;
};

const onSelectedFiles = (event: FileUploadSelectEvent) => {
    normalizedFiles.value = normalizeFiles(event.files);

    event.files.forEach((file: File) => {
        totalSize.value += parseInt(formatSize(file.size));
    });
};

const normalizeFiles = (files: File[]) => {
    const normalizedFiles: { input?: File, output?: File }[] = [];

    files.forEach((file) => {
        const dotIndex = file.name.lastIndexOf('.');
        const fileName = file.name.substring(0, dotIndex);
        const extension = file.name.substring(dotIndex + 1);

        if (extension === 'in') {
            const index = normalizedFiles.findIndex(f => f.output?.name === fileName + '.out');
            if (index !== -1) {
                normalizedFiles[index].input = file;
            } else {
                normalizedFiles.push({ input: file });
            }
        } else if (extension === 'out') {
            const index = normalizedFiles.findIndex(f => f.input?.name === fileName + '.in');
            if (index !== -1) {
                normalizedFiles[index].output = file;
            } else {
                normalizedFiles.push({ output: file });
            }
        }
    });

    return normalizedFiles;
}

const formatSize = (bytes: number) => {
    const k = 1024;
    const dm = 3;
    const sizes = $primevue.config.locale?.fileSizeTypes || [0];

    if (bytes === 0) {
        return `0 ${sizes[0]}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formattedSize} ${sizes[i]}`;
};
</script>

<template>
    <div class="flex-1 flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <div class="max-w-full md:max-w-[768px] mx-auto">
            <Panel class="mt-10">
                
            </Panel>
        </div>
        <UniversalFooter></UniversalFooter>
    </div>
</template>

<style scoped>
:deep(svg.md-editor-icon) {
    width: revert-layer;
    height: revert-layer;
}
</style>