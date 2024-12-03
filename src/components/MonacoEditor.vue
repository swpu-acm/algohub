<script setup lang="ts">
import loader from '@monaco-editor/loader'
import type { editor as Editor } from 'monaco-editor';
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useThemeStore } from '@/scripts/store';
import type { SelectChangeEvent } from 'primevue';
import { Language } from '@/scripts/types';

const language = defineModel<Language>('language', { default: Language.Rust });
const emit = defineEmits(['submit'])

const themeStore = useThemeStore();

const editor = ref<Editor.IStandaloneCodeEditor>();
const rawEditor = computed(() => toRaw(editor.value));
const editorContainer = ref();

self.MonacoEnvironment = {
    getWorker: function (_, label) {
        switch (label) {
            case 'json':
                return new jsonWorker();
            case 'css':
            case 'scss':
            case 'less':
                return new cssWorker();
            case 'html':
            case 'handlebars':
            case 'razor':
                return new htmlWorker();
            case 'typescript':
            case 'javascript':
                return new tsWorker();
            default:
                return new editorWorker();
        }
    }
};

watch(() => themeStore.dark, () => {
    editor.value?.updateOptions({
        theme: themeStore.dark ? 'vs-dark' : 'vs',
    })
})

onMounted(async () => {
    if (!editorContainer.value) {
        throw new Error('Editor container not found');
    }
    loader.config({ monaco })
    editor.value = await loader.init().then((monaco) => monaco.editor.create(editorContainer.value, {
        value: '',
        language: language.value,
        theme: themeStore.dark ? 'vs-dark' : 'vs',
        fontFamily: 'Cascadia Code, Consolas, Menlo, Monaco, "Courier New", monospace',
        inlineSuggest: {
            enabled: true,
        },
        automaticLayout: true,
    }));
})

const disposeEditor = () => {
    if (editor.value) {
        toRaw(editor.value).dispose();
    }
}

onUnmounted(disposeEditor)
onBeforeUnmount(disposeEditor)
onBeforeRouteLeave(disposeEditor)

console.log(Language)
console.log(Object.values(Language))
console.log(Object.keys(Language))
console.log(Object.entries(Language))

const languageOptions = Object.entries(Language).map(([name, value]) => ({ name, value }))

const onChangeLanguage = (value: SelectChangeEvent) => {
    const editor = rawEditor.value;
    if (editor) {
        const model = editor.getModel();
        model && monaco.editor.setModelLanguage(model, value.value);
    }
}

type Severity = 'info' | "secondary" | 'warn' | 'error';

const submitting = ref(false)
const message = ref<{ text?: string, severity: Severity }>({ text: undefined, severity: 'info' })
const onSubmit = () => {
    if (!rawEditor.value) {
        return
    }
    submitting.value = true
    emit(
        'submit',
        rawEditor.value.getValue(),
        language,
        (text: string, severity: Severity) => {
            submitting.value = false
            message.value = { text, severity }
        }
    )
}
</script>

<template>
    <div class="w-full h-full flex flex-col">
        <div class="flex flex-row m-[6px] justify-between">
            <Select v-model="language" @change="onChangeLanguage" :options="languageOptions" optionLabel="name"
                optionValue="value" placeholder="Select a Language"></Select>
            <Button @click="onSubmit" label="Submit" icon="pi pi-send" size="small" severity="contrast" outlined
                :loading="submitting"></Button>
        </div>
        <Message size="small" v-if="message.text" :severity="message.severity">{{ message.text }}</Message>
        <div class="flex-1" ref="editorContainer"></div>
    </div>
</template>
