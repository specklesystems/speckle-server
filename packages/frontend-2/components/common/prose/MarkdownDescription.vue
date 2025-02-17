<!-- eslint-disable vue/no-v-html -->
<template>
  <div :class="proseClasses" v-html="cleanReadmeHtml"></div>
</template>
<script setup lang="ts">
import { useMarkdown } from '~/lib/common/composables/markdown'

const props = defineProps<{
  markdown: string | null | undefined
}>()

const { html: cleanReadmeHtml } = useMarkdown(computed(() => props.markdown || ''))

const proseClasses = ref([
  'prose-sm max-w-none',
  'prose-img:inline',
  'prose-img:my-0',
  'prose-h1:h2 prose-h1:font-medium prose-h1:mb-8',
  'prose-h2:h3 prose-h2:font-medium prose-h2:mt-0 prose-h2:mb-6',
  'prose-h3:h4 prose-h3:mb-4',
  'prose-h4:h5 prose-h4:mb-4',
  'prose-h5:h6 prose-h5:mb-4 prose-h5:font-medium',
  'prose-h6:h6 prose-h6:mb-4 prose-h6:font-medium prose-h6:text-sm',
  'dark:prose-invert'
])
</script>
