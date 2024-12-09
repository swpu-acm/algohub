<script setup lang="ts">
import { useToast } from 'primevue';
import * as api from "@/scripts/api";
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/scripts/store';
import { ref } from 'vue';
import { Mode, Visibility } from '@/scripts/types';

const path = [{ label: 'New problem' }];

const router = useRouter();
const toast = useToast();

const accountStore = useAccountStore();
if (!accountStore.isLoggedIn) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Please login first', life: 3000 });
    router.push('/login');
}

const name = ref('');
const description = ref('');
const start_time = ref<Date>();
const end_time = ref<Date>();

const inProgress = ref(false);
const onCreateContest = async () => {
    inProgress.value = true;
    const res = await api.createContest({
        auth: accountStore.auth!,
        data: {
            name: name.value,
            description: description.value,
            start_time: start_time.value!.toISOString().replace('Z', ''),
            end_time: end_time.value!.toISOString().replace('Z', ''),
            mode: Mode.ICPC,
            visibility: Visibility.Public,
            owner: accountStore.recordId
        }
    })
    if (!res.success) {
        toast.add({ severity: 'error', summary: 'Error', detail: res.message, life: 3000 });
    };
    inProgress.value = false;
    router.push('/contest/' + res.data!.id);
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <div class="max-w-full w-[768px] md:max-w-[768px] mx-auto">
            <Panel class="mt-10 w-full h-full">
                <div class="flex flex-col gap-8 w-full">
                    <div class="mt-10 text-center">
                        <span class="text-gray-500 mb-4">Create a new contest</span>
                        <h1 class="text-3xl font-bold">Create contest</h1>
                    </div>
                    <div class="flex flex-row gap-4">
                        <div class="flex flex-col">
                            <label for="owner">Owner *</label>
                            <Select name="owner" disabled></Select>
                        </div>
                        <span class="flex flex-col justify-end">
                            <span class="text-bold mb-2">/</span>
                        </span>
                        <div class="flex flex-col">
                            <label for="name">Name *</label>
                            <InputText v-model="name" name="name"></InputText>
                        </div>
                    </div>
                    <MarkdownEditor v-model="description" placeholder="Description"></MarkdownEditor>
                    <div class="flex flex-row gap-4">
                        <DatePicker v-model="start_time" placeholder="Start date" showTime></DatePicker>
                        <DatePicker v-model="end_time" placeholder="End date" showTime></DatePicker>
                    </div>
                    <Button @click="onCreateContest" :loading="inProgress" label="Save Changes"></Button>
                </div>
            </Panel>
        </div>
        <UniversalFooter></UniversalFooter>
    </div>
</template>
