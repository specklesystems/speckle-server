<!-- eslint-disable vue/no-v-html -->
<template>
  <div :class="proseClasses" v-html="cleanReadmeHtml"></div>
</template>
<script setup lang="ts">
import { proseClasses, useMarkdown } from '~/lib/common/composables/markdown'
const props = defineProps<{
  markdown: string | null | undefined
}>()

const { html: cleanReadmeHtml } = useMarkdown(computed(() => props.markdown || ''))
</script>
