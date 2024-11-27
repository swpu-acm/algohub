<script setup lang="ts">
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { expandUrl } from '@/scripts/utils';
import { useToast } from 'primevue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
    path?: {
        icon: string,
        label: string,
        link: string,
        command: () => void
    }[]
}>()

const router = useRouter();
const toast = useToast();

const accountStore = useAccountStore();
const themeStore = useThemeStore();

const avatarUrl = computed(() => expandUrl(accountStore.account?.avatar));

const isShowUserPanel = ref(false);
const userPanelItems = ref([
    {
        icon: 'pi pi-sign-out',
        label: 'Sign out',
        command: () => {
            accountStore.logout();
            router.push("/");
        }
    }
])

const menu = ref();
const createMenuItems = ref([
    {
        label: 'New Problem',
        icon: 'pi pi-question',
        command: () => {
            router.push("/problem/create");
        }
    },
    {
        label: 'New Organization',
        icon: 'pi pi-building',
        admin: true,
        command: () => {
            toast.add({ severity: 'info', summary: 'Coming soon...', detail: 'This feature is coming soon...' })
        }
    }
]);
const toggleCreateMenu = (event: any) => {
    menu.value.toggle(event);
};
</script>

<template>
    <Drawer v-model:visible="isShowUserPanel" position="right">
        <template #container>
            <header class="flex flex-row items-center justify-between gap-1 p-4">
                <div class="flex flex-row gap-4 items-center">
                    <Avatar :image="avatarUrl" shape="circle"></Avatar>
                    <div class="flex flex-col items-start">
                        <span class="text-sm font-semibold">{{ accountStore.account?.username }}</span>
                        <span class="text-xs text-gray-500">{{ accountStore.account?.nickname }}</span>
                    </div>
                </div>
                <Button @click="isShowUserPanel = !isShowUserPanel" :icon="`pi pi-times`" plain text></Button>
            </header>
            <div class="border-t border-[1.2px] dark:border-gray-600 mx-6"></div>
            <div class="flex-1 flex-col overflow-y-auto overflow-x-hidden my-3 px-4">
                <div v-for="item in userPanelItems" class="w-full">
                    <Button @click="item.command" class="!justify-start !px-[1rem]" :icon="item.icon"
                        :label="item.label" plain text fluid></Button>
                </div>
            </div>
            <div class="border-t border-[1.2px] dark:border-gray-600 mx-6"></div>
            <footer class="flex flex-row items-center justify-between gap-2 p-4">
                <div class="flex flex-row gap-4 items-center">
                    <Avatar :image="themeStore.logo" shape="circle" size="large"></Avatar>
                    <div class="flex flex-col items-start">
                        <span class="text-[1rem] font-semibold">AlgoHub</span>
                        <span class="text-xs text-gray-500">Powered by SWPU-ACM</span>
                    </div>
                </div>
            </footer>
        </template>
    </Drawer>
    <div class="bg-gray-100 dark:bg-zinc-900 flex flex-row items-center justify-between w-full p-3 flex-wrap">
        <div class="inline-flex justify-center items-center">
            <img :src="themeStore.dark ? '/acm-light.png' : '/acm.png'" width="40"></img>
            <Breadcrumb :model="props.path">
                <template #item="{ item }">
                    <a :class="item.link ? 'cursor-pointer' : ''" :href="item.link">
                        <span :class="item.icon"></span>
                        <span>{{ item.label }}</span>
                    </a>
                </template>
                <template #separator> / </template>
            </Breadcrumb>
        </div>
        <div class="inline-flex justify-center items-center gap-3">
            <Button @click="toggleCreateMenu" aria-haspopup="true" aria-controls="overlay_menu" plain outlined>
                <span class="pi pi-plus" data-pc-section="icon"></span>
                <span class="w-0" data-pc-section="label">&nbsp;</span>
                <i class="pi pi-angle-down"></i>
            </Button>
            <Menu ref="menu" id="overlay_menu" :model="createMenuItems" :popup="true">
                <template #submenuitem="{ item }">
                    <span class="font-bold">{{ item.label }}</span>
                </template>
                <template #item="{ item, props }">
                    <a v-if="!item.admin ? true : accountStore.isAdmin" v-ripple class="flex items-center"
                        v-bind="props.action">
                        <span :class="item.icon"></span>
                        <span>{{ item.label }}</span>
                    </a>
                </template>
            </Menu>
            <Button @click="themeStore.toggle" :icon="`pi pi-${themeStore.dark ? 'moon' : 'sun'}`" plain
                outlined></Button>
            <Divider layout="vertical" class="!mx-1"></Divider>
            <Avatar @click="isShowUserPanel = !isShowUserPanel" :image="avatarUrl" class="!cursor-pointer"
                shape="circle">
            </Avatar>
        </div>
    </div>
</template>