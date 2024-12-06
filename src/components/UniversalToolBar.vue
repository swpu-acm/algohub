<script setup lang="ts">
import { useAccountStore, useThemeStore } from '@/scripts/store';
import { Avatar, Skeleton, useToast } from 'primevue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const { path, separateBottom } = defineProps({
    path: {
        type: Object as () => {
            icon: string,
            label: string,
            link: string,
            command: () => void
        }[],
        default: []
    },
    separateBottom: {
        type: Boolean,
        default: undefined
    }
})

const router = useRouter();
const toast = useToast();

const accountStore = useAccountStore();
const themeStore = useThemeStore();

const isShowUserPanel = ref(false);
const userPanelItems = ref<{
    icon?: string,
    label?: string,
    command?: () => void,
    separator?: boolean
}[]>([
    {
        icon: 'pi pi-user',
        label: 'Your Profile',
        command: () => {
            router.push(`/account/${accountStore.account?.username}`);
        }
    },
    {
        icon: 'pi pi-book',
        label: 'Your Problems',
        command: () => {
            router.push(`/account/${accountStore.account?.username}?tab=problems`);
        }
    },
    {
        separator: true
    },
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
        command: () => {
            toast.add({ severity: 'info', summary: 'Coming soon...', detail: 'This feature is coming soon...' })
        }
    },
    {
        separator: true
    },
    {
        label: 'New Contest',
        icon: 'pi pi-calendar',
        command: () => {
            router.push("/contest/create");
        }
    }
]);
const toggleCreateMenu = (event: any) => {
    menu.value.toggle(event);
};

const toString = (value: any) => {
    if (typeof value === 'function') {
        return value.toString();
    }
    return value;
}
</script>

<template>
    <Drawer v-model:visible="isShowUserPanel" position="right">
        <template #container>
            <header class="flex flex-row items-center justify-between gap-1 p-4">
                <div class="flex flex-row gap-4 items-center">
                    <Avatar :image="accountStore.avatarUrl" shape="circle"></Avatar>
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
                    <div v-if="item.separator" class="border-t border-[1.2px] dark:border-gray-600 mx-3 my-1"></div>
                    <Button v-else @click="item.command" class="!justify-start !px-[1rem]" :icon="item.icon"
                        :label="item.label" size="small" plain text fluid></Button>
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
    <div class="bg-gray-100 dark:bg-zinc-900 flex flex-row items-center justify-between w-full py-3 px-5 flex-wrap"
        :class="{ 'border-b-[1.2px] border-zinc-300 dark:border-zinc-600 shadow-sm': separateBottom ?? true }">
        <div class="inline-flex justify-center items-center">
            <img @click="router.push('/')" class="cursor-pointer" :src="themeStore.dark ? '/acm-light.png' : '/acm.png'" width="40"></img>
            <Breadcrumb v-if="path?.length" :model="path" class="!bg-transparent !p-0">
                <template #item="{ item }">
                    <Button v-if="item.link" v-ripple @click="router.push(item.link)" :icon="item.icon"
                        :label="toString(item.label)" size="small" plain text></Button>
                    <a v-else :href="item.link" class="px-2">
                        <span v-if="item.icon" class="item.icon"></span>
                        <span class="text-sm">{{ item.label }}</span>
                    </a>
                </template>
                <template #separator> / </template>
            </Breadcrumb>
            <Skeleton v-else class="ml-2 my-1" width="100px" height="20px"></Skeleton>
        </div>
        <div class="inline-flex justify-center items-center gap-3">
            <Button v-if="accountStore.isLoggedIn" v-ripple @click="toggleCreateMenu" aria-haspopup="true"
                aria-controls="overlay_menu" plain outlined>
                <span class="pi pi-plus" data-pc-section="icon"></span>
                <span class="w-0" data-pc-section="label">&nbsp;</span>
                <i class="pi pi-angle-down"></i>
            </Button>
            <Menu v-if="accountStore.isLoggedIn" ref="menu" id="overlay_menu" :model="createMenuItems" :popup="true">
                <template #submenuitem="{ item }">
                    <span class="font-bold">{{ item.label }}</span>
                </template>
                <template #item="{ item, props }">
                    <a v-ripple class="flex items-center" v-bind="props.action">
                        <span :class="item.icon"></span>
                        <span>{{ item.label }}</span>
                    </a>
                </template>
            </Menu>
            <Button v-if="accountStore.isLoggedIn" v-ripple
                @click="router.push(`/account/${accountStore.account?.username}?tab=problems`)" icon="pi pi-book" plain
                outlined></Button>
            <Button v-ripple @click="themeStore.toggle" :icon="`pi pi-${themeStore.dark ? 'moon' : 'sun'}`" plain
                outlined></Button>
            <Divider v-if="accountStore.isLoggedIn" layout="vertical" class="!mx-1"></Divider>
            <Avatar v-if="accountStore.isLoggedIn && accountStore.avatarUrl" @click="isShowUserPanel = !isShowUserPanel"
                :image="accountStore.avatarUrl" class="!cursor-pointer" shape="circle">
            </Avatar>
            <Avatar v-else-if="accountStore.isLoggedIn && accountStore.account?.username"
                @click="isShowUserPanel = !isShowUserPanel" class="!cursor-pointer" shape="circle"
                :label="accountStore.account.username[0]"></Avatar>
            <Skeleton v-else shape="circle" size="2em"></Skeleton>
        </div>
    </div>
</template>
