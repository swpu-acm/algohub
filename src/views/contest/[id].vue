<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as api from '@/scripts/api';
import { useRoute } from 'vue-router';
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { Contest, ContestProblem, ContestRank } from '@/scripts/types';
import { useToast } from 'primevue';

const route = useRoute();
const id = route.params.id as string;
const accountStore = useAccountStore();
const themeStore = useThemeStore();
const toast = useToast();

const contest = ref<Contest>();
const problems = ref<ContestProblem[]>();
const loading = ref(true);
const duration = ref('');
onMounted(async () => {
    const contestRes = await api.fetchContest(id, accountStore.auth!);
    if (!contestRes.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: contestRes.message });
    }
    contest.value = contestRes.data;

    const res = await api.listProblemsByContest(id, accountStore.auth!)
    if (!res.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
    problems.value = res.data?.map((problem) => { return { ...problem, accuracy: problem.acceptedCount / problem.submittedCount } });
    duration.value = calcDateDiff(new Date(contest.value?.start_time!), new Date(contest.value?.end_time!))

    loading.value = false;
})

const hasStarted = () => {
    let startTime = new Date(contest.value?.start_time!);
    return startTime.getTime() < new Date().getTime()
}
const notEnded = () => {
    let endTime = new Date(contest.value?.end_time!);
    return endTime.getTime() > new Date().getTime()
}
const path = ref([{ label: 'Contests' }])

const selectedPanel = ref('contest')
const togglePanel = async (panel: string) => {
    selectedPanel.value = panel
    switch (panel) {
        case 'ranks':
            await onToggleRanking();
    }
}

const ranks = ref<ContestRank[]>();
const onToggleRanking = async () => {
    console.log('toggle ranking')
    const res = await api.fetchRanks(id, accountStore.auth!);
    if (!res.success) {
        return toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
    ranks.value = res.data;
    console.log(ranks.value)
}

function calcTimeDiff(start: Date, now: Date) {
    const startTimeStamp = start.getTime();
    const endTimeStamp = now.getTime();

    const moreThan = endTimeStamp - startTimeStamp > 0;
    const instant = Math.abs(endTimeStamp - startTimeStamp);

    const hours = Math.floor(instant / (1000 * 60 * 60));
    const minutes = Math.floor((instant % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((instant % (1000 * 60)) / 1000);

    const sign = moreThan ? '-' : '';
    const formattedDifference = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return formattedDifference;
}

function calcDateDiff(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const instant = Math.abs(end.getTime() - start.getTime());

    const days = Math.floor(instant / (1000 * 60 * 60 * 24));
    const hours = Math.floor((instant % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((instant % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}min`;
}

const timeDiff = ref(calcTimeDiff(new Date(contest.value?.start_time!), new Date()))
const interval = setInterval(() => {
    timeDiff.value = calcTimeDiff(new Date(contest.value?.start_time!), new Date())
}, 1000)

onUnmounted(() => {
    clearInterval(interval)
})
</script>

<template>
    <div class="flex flex-col h-full">
        <UniversalToolBar :path></UniversalToolBar>
        <div class="w-full flex flex-1 flex-row">
            <div class="bg-gray-100 dark:bg-zinc-900 border-r-[1.5px] dark:border-zinc-700">
                <div class="py-3 flex flex-col gap-4 sticky top-0 bottom-0 z-30 items-center">
                    <Button @click="togglePanel('contest')" pt:label:class="text-xs" label="Contest" icon="pi pi-code"
                        size="small" iconPos="top" plain text></Button>
                    <!-- <Button @click="togglePanel('records')" pt:label:class="text-xs" label="Records" icon="pi pi-file"
                        size="small" iconPos="top" plain text disabled></Button> -->
                    <Button
                        @click="toast.add({ severity: 'info', summary: 'Coming Soon', detail: 'Ranking is still under beta and never fully tested, this may not work as expected.', life: 3000 });"
                        pt:label:class="text-xs" label="Ranks" icon="pi pi-chart-line" size="small" iconPos="top" plain
                        text></Button>
                </div>
            </div>
            <div v-if="selectedPanel === 'contest'" class="flex flex-col w-full h-full p-10 gap-8">
                <Message v-if="contest?.announcement" severity="info">{{ contest?.announcement }}</Message>
                <div class="flex flex-row flex-wrap gap-4">
                    <Panel class="hidden sm:flex" pt:header:class="!hidden" pt:content:class="!p-0">
                        <Image :src="themeStore.logo" imageClass="w-[10em] h-[10em] md:w-[16em] md:h-[16em]">
                        </Image>
                    </Panel>
                    <Panel class="flex-grow">
                        <template #header>
                            <div class="flex justify-center items-center w-full">
                                <span class="text-2xl font-bold">Time to start</span>
                            </div>
                        </template>
                        <template #default>
                            <div class="h-full flex items-center justify-center">
                                <span class="text-center text-3xl md:text-5xl lg:text-6xl font-bold">{{ timeDiff
                                    }}</span>
                            </div>
                        </template>
                    </Panel>
                    <Panel class="flex-grow">
                        <template #header>
                            <div class="flex justify-between px-8 items-center w-full">
                                <span class="text-2xl font-bold">Contest Details</span>
                                <Badge v-if="!hasStarted()" severity="warn" size="large">Not Started</Badge>
                                <Badge v-else-if="hasStarted() && notEnded()" severity="success" size="large">
                                    Ongoing
                                </Badge>
                                <Badge v-else-if="!notEnded()" severity="danger" size="large">Ended</Badge>
                            </div>
                        </template>
                        <template #default>
                            <div class="flex flex-col gap-4 px-8">
                                <div class="flex flex-row items-center gap-4">
                                    <h1 class="text-3xl font-bold">{{ contest?.name }}</h1>
                                    <Badge>{{ contest?.mode }}</Badge>
                                </div>
                                <p>
                                    {{ contest?.description }}
                                </p>
                                <div class="flex flex-col gap-2">
                                    <span class="text-sm">From {{ contest?.start_time }} to {{ contest?.end_time
                                        }}</span>
                                    <span class="text-sm">Duration {{ duration }}</span>
                                </div>
                            </div>
                        </template>
                    </Panel>
                </div>
                <Panel v-if="!loading && hasStarted() && notEnded()" class="w-full h-full mt-4">
                    <template #header>
                        <div></div>
                    </template>
                    <template #default>
                        <DataTable :value="problems" class="h-full w-full">
                            <template #header>
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <span class="text-xl font-bold">Problems</span>
                                </div>
                            </template>
                            <Column field="title" header="Title">
                                <template #body="slotProps">
                                    <a target="_blank" :href="`#/problem/${slotProps.data.id}`"
                                        class="cursor-pointer text-blue-500 hover:underline">{{ slotProps.data.title
                                        }}</a>
                                </template>
                            </Column>
                            <Column field="acceptedCount" header="Accepted" sortable></Column>
                            <Column field="submittedCount" header="Submitted" sortable></Column>
                            <Column field="accuracy" header="Accuracy" sortable></Column>
                            <Column field="solved" header="Status" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center justify-center rounded-full w-[1.5em] h-[1.5em]"
                                        :class="{ 'bg-green-400': slotProps.data.solved, 'bg-red-400': !slotProps.data.solved }">
                                        <i class="pi" :class="slotProps.data.solved ? 'pi-check' : 'pi-times'"></i>
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Panel>
            </div>
            <div v-else-if="selectedPanel === 'ranks'" class="flex flex-col w-full h-full p-10 gap-8">
                <Message severity="warn">Ranking is still under <code>beta</code> and never fully tested, this may not
                    work as expected.
                </Message>
                <Panel class="w-full h-full mt-4">
                    <template #header>
                        <div>Ranks</div>
                    </template>
                    <template #default>
                        <DataTable v-if="ranks && ranks.length > 0" :value="ranks">
                            <Column field="id" header="UserID"></Column>
                            <Column v-for="detail in ranks[0].details" :key="detail.name" :header="detail.name"
                                field="details">
                                <template #body="slotProps">
                                    {{ slotProps }}
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Panel>
            </div>
        </div>
    </div>
</template>