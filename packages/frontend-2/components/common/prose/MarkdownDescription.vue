<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="prose-sm max-w-auto overflow-auto" v-html="cleanReadmeHtml"></div>
</template>
<script setup lang="ts">
import { useMarkdown } from '~/lib/common/composables/markdown'

const props = defineProps<{
  markdown: string | null | undefined
}>()

const { html: cleanReadmeHtml } = useMarkdown(computed(() => props.markdown || ''))
</script>
