<script setup lang="ts">
import * as api from "@/scripts/api";
import type { Profile } from "@/scripts/types";
import { useToast } from "primevue";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const id = route.params.id as string;
const toast = useToast();

const path = ref<{ label: string; to: string; }[]>([]);

const profile = ref<Profile>();

const loading = ref(true);
onMounted(async () => {
    const res = await api.fetchProfile(id);
    if (!res.success) {
        return toast.add({ severity: "error", summary: "Error", detail: res.message });
    }
    profile.value = res.data;
    path.value = [
        { label: profile.value!.username, to: "/" }
    ]
    loading.value = false;
})
</script>

<template>
    <div class="w-full h-full flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
    </div>
</template>

<style scoped></style>