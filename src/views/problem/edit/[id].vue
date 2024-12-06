<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id as string;
</script>

<template>
    <div class="flex-1 flex flex-col h-full">
        <ProblemEditor :id></ProblemEditor>
        <UniversalFooter></UniversalFooter>
    </div>
</template>
