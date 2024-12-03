<script setup lang="ts">
const path = [{ label: 'New problem' }];
</script>

<template>
    <div class="flex-1 flex flex-col">
        <UniversalToolBar :path></UniversalToolBar>
        <ProblemEditor></ProblemEditor>
        <UniversalFooter></UniversalFooter>
    </div>
</template>
