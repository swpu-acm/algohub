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

const title = ref('');
const description = ref('');
const input = ref('');
const output = ref('');
const samples = reactive<{ input: string, output: string }[]>([{ input: '', output: '' }]);
const hint = ref('');
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
        owner: {
            tb: "account",
            id: accountStore.account.id!
        },
        categories: [],
        tags: [],
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

const uploadTestCases = async (callback: () => void) => {
    normalizedFiles.value.forEach(async (fileTuple) => {
        if (!fileTuple.input) {
            return toast.add({ severity: 'error', summary: 'Error', detail: 'Input file not found for ' + fileTuple.output?.name, life: 3000 });
        } else if (!fileTuple.output) {
            return toast.add({ severity: 'error', summary: 'Error', detail: 'Output file not found for ' + fileTuple.input?.name, life: 3000 });
        }

        const res = await api.uploadContent({
            auth: accountStore.auth!,
            owner: `account:${accountStore.account.id}`,
            file: fileTuple.input,
        })
        if (!res.success) {
            return toast.add({ severity: 'error', summary: 'Error', detail: res.message, life: 3000 });
        } else {
            totalUploadedSize.value += parseInt(formatSize(fileTuple.input.size));
        }

        const outputRes = await api.uploadContent({
            auth: accountStore.auth!,
            owner: `account:${accountStore.account.id}`,
            file: fileTuple.output,
        })
        if (!outputRes.success) {
            return toast.add({ severity: 'error', summary: 'Error', detail: outputRes.message, life: 3000 });
        } else {
            totalUploadedSize.value += parseInt(formatSize(fileTuple.output.size));
        }

        testCases.push({
            input: res.data!.id,
            output: outputRes.data!.id,
        })
        normalizedFiles.value.splice(normalizedFiles.value.indexOf(fileTuple), 1);
    });
    callback();
}

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
                <div class="flex flex-col gap-8">
                    <div class="mt-10 text-center">
                        <span class="text-gray-500 mb-4">Share your algorithm problem with the community</span>
                        <h1 class="text-3xl font-bold mb-4">Create a new algorithm problem</h1>
                    </div>
                    <div class="flex flex-col gap-8">
                        <div class="flex flex-col gap-1">
                            <InputText v-model="title" type="text" name="title" placeholder="Problem Title" fluid>
                            </InputText>
                        </div>
                        <MarkdownEditor v-model="description" placeholder="Problem Description" id="description" />
                        <MarkdownEditor v-model="input" placeholder="Input Format" id="input" />
                        <MarkdownEditor v-model="output" placeholder="Output Format" id="output" />
                        <Divider class="!mb-0"></Divider>
                        <div class="flex flex-row justify-end items-center">
                            <Button type="button" class="mr-2" outlined
                                @click="samples.push({ input: '', output: '' })">Add
                                Sample</Button>
                        </div>
                        <div v-for="(sample, index) in samples" :key="index" class="flex flex-col gap-2">
                            <div class="flex flex-row justify-between items-center">
                                <label class="text-gray-500">Sample #{{ index + 1 }}</label>
                                <Button @click="samples.splice(index, 1)" icon="pi pi-times" plain text></Button>
                            </div>
                            <div class="flex flex-row gap-2 min-h-40">
                                <Textarea v-model:modelValue="sample.input" placeholder="Example Input"
                                    class="w-full"></Textarea>
                                <Textarea v-model:modelValue="sample.output" placeholder="Example Output"
                                    class="w-full"></Textarea>
                            </div>
                        </div>
                        <Divider class="!m-0"></Divider>
                        <MarkdownEditor v-model="hint" placeholder="Hint" id="hint" />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup>
                                <InputGroupAddon>
                                    <i class="pi pi-clock"></i>
                                </InputGroupAddon>
                                <InputNumber v-model="timeLimit" placeholder="Time Limit" />
                                <InputGroupAddon>ms</InputGroupAddon>
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>
                                    <i class="pi pi-box"></i>
                                </InputGroupAddon>
                                <InputNumber v-model="memoryLimit" placeholder="Time Limit" />
                                <InputGroupAddon>MB</InputGroupAddon>
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>
                                    <i class="pi pi-building"></i>
                                </InputGroupAddon>
                                <Select placeholder="Owner" disabled></Select>
                            </InputGroup>
                        </div>
                        <FileUpload customUpload :multiple="true" accept=".in,.out" :maxFileSize="12 * 1024 * 1024"
                            @select="onSelectedFiles">
                            <template #header="{ chooseCallback, clearCallback, files }">
                                <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                                    <div class="flex gap-2">
                                        <Button @click="chooseCallback" icon="pi pi-file-arrow-up" rounded outlined
                                            severity="secondary"></Button>
                                        <Button icon="pi pi-clipboard" rounded outlined severity="info"
                                            disabled></Button>
                                        <Button @click="uploadTestCases(clearCallback)" icon="pi pi-cloud-upload"
                                            rounded outlined severity="success"
                                            :disabled="!files || files.length === 0"></Button>
                                        <Button @click="onClearTemplatingUpload(clearCallback)" icon="pi pi-times"
                                            rounded outlined severity="danger"
                                            :disabled="!files || files.length === 0"></Button>
                                    </div>
                                    <ProgressBar :value="totalSizePercent" :showValue="false"
                                        class="md:w-20rem h-1 w-full md:ml-auto">
                                    </ProgressBar>
                                </div>
                            </template>
                            <template #content="{ files, removeFileCallback, messages }">
                                <div class="flex flex-col gap-8 pt-4">
                                    <Message v-for="message of messages" :key="message" severity="error">
                                        {{ message }}
                                    </Message>

                                    <div v-if="normalizedFiles.length > 0">
                                        <h5>Pending</h5>
                                        <div class="flex flex-wrap gap-4">
                                            <div v-for="(testCase, normalizedIndex) of normalizedFiles"
                                                :key="normalizedIndex"
                                                class="p-8 rounded border border-zinc-200 dark:border-zinc-700">
                                                <div class="flex flex-row justify-between items-center">
                                                    <div v-if="testCase.input" class="flex flex-col gap-4 items-center">
                                                        <span
                                                            class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{
                                                                testCase.input.name }}</span>
                                                        <div>{{ formatSize(testCase.input.size || 0) }}</div>
                                                        <Badge value="Pending" severity="warn" />
                                                        <Button icon="pi pi-times"
                                                            @click="onRemoveTemplatingFile('input', { removeFileCallback, plainFiles: files, normalizedIndex })"
                                                            outlined rounded severity="danger"></Button>
                                                    </div>
                                                    <Divider v-if="testCase.input && testCase.output" layout="vertical">
                                                    </Divider>
                                                    <div v-if="testCase.output"
                                                        class="flex flex-col gap-4 items-center">
                                                        <span
                                                            class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{
                                                                testCase.output.name }}</span>
                                                        <div>{{ formatSize(testCase.output.size || 0) }}</div>
                                                        <Badge value="Pending" severity="warn" />
                                                        <Button icon="pi pi-times"
                                                            @click="onRemoveTemplatingFile('output', { removeFileCallback, plainFiles: files, normalizedIndex })"
                                                            outlined rounded severity="danger"></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template #empty>
                                <div class="flex items-center justify-center flex-col">
                                    <i
                                        class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
                                    <p class="mt-6 mb-0">Drag and drop test cases to here to upload.</p>
                                </div>
                            </template>
                        </FileUpload>
                        <DataTable :value="testCases" tableStyle="min-width: 50rem">
                            <Column field="input" header="Code"></Column>
                            <Column field="output" header="Name"></Column>
                        </DataTable>
                        <div class="flex items-center gap-2">
                            <Checkbox name="private" v-model="isPrivate" binary></Checkbox>
                            <span>Mark as private</span>
                        </div>
                        <Button @click="onCreateProblem" type="submit" label="Save Changes"></Button>
                    </div>
                </div>
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