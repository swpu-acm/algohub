<script setup lang="ts">
import { useThemeStore } from '@/scripts/store';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const value = defineModel<string>({ required: true })
const props = defineProps(['id', 'placeholder'])

const themeStore = useThemeStore();
</script>

<template>
    <MdEditor v-model="value" :editorId="props.id" :placeholder="props.placeholder" :language="'en-US'"
        :theme="themeStore.dark ? 'dark' : 'light'" codeTheme="github" previewTheme="github" :tabWidth="4" :toolbars="[
            'bold',
            'underline',
            'italic',
            '-',
            'title',
            'strikeThrough',
            'sub',
            'sup',
            'quote',
            'unorderedList',
            'orderedList',
            '-',
            'codeRow',
            'code',
            'link',
            'image',
            'table',
            'katex',
            '=',
            'pageFullscreen',
            'preview',
            'previewOnly',
        ]"></MdEditor>
</template>

<style scoped>
:deep(svg.md-editor-icon) {
    width: revert-layer;
    height: revert-layer;
}
</style>
