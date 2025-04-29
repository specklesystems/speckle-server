<!-- eslint-disable vue/no-v-html -->
<template>
  <div v-if="cleanReadmeHtml.length" :class="proseClasses" v-html="cleanReadmeHtml" />
  <div v-else class="text-foreground-2 text-body-xs text-center italic">
    No readme found
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { useMarkdown } from '~/lib/common/composables/markdown'

const relativeLinkRegex = /\[(.+?)\]\(\/(.*?)\)/gi

const props = defineProps<{
  readmeMarkdown: string
  repo: string // e.g. 'specklesystems/speckle-server'
  commitId?: string
}>()

const logger = useLogger()

const relativeLinkBaseUrl = computed(
  () => `https://raw.githubusercontent.com/${props.repo}/${props.commitId || 'main'}/`
)

const finalMarkdown = computed(() => {
  // Transform relative URLs to absolute URLs using the GitHub repo URL as a base URI
  const source = props.readmeMarkdown
  if (!source.length) return ''

  // Find all relative links and append the repo URL to them
  const newSource = source.replace(
    relativeLinkRegex,
    (match, linkText: Nullable<string>, relativePath: Nullable<string>) => {
      let finalUrl = match
      if (!linkText?.length || !relativePath?.length) return match

      try {
        const url = new URL(relativePath, relativeLinkBaseUrl.value).toString()
        finalUrl = `[${linkText}](${url})`
      } catch (e) {
        logger.warn(e)
      }

      return finalUrl
    }
  )

  return newSource
})

const { html: cleanReadmeHtml } = useMarkdown(
  computed(() => finalMarkdown.value),
  { key: 'CommonProseGithubReadme' }
)

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

  // Inline code
  'prose-code:bg-foundation-2 prose-code:text-foreground prose-code:font-mono prose-code:text-body-xs prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
  'prose-code:border prose-code:border-outline-3',

  // List styling (ordererd- and unordered lists)
  'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3',
  'prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3',
  'prose-li:my-1 prose-li:marker:text-foreground-3',

  // Links
  'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',

  // Code blocks
  // TODO: kinda superimposing inline and code blocks? 🫣
  'prose-pre:bg-foundation-2 prose-pre:rounded prose-pre:p-4',
  'prose-pre:overflow-x-auto',
  'prose-pre:simple-scrollbar',

  // Blockquotes
  'prose-blockquote:border-l-4 prose-blockquote:border-outline-3 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground-2',
  'dark:prose-invert',

  // Dark mode
  'dark:prose-invert',
  'dark:prose-code:bg-foundation-2 dark:prose-code:border-outline-3',
  'dark:prose-pre:bg-foundation-2'
])
</script>
