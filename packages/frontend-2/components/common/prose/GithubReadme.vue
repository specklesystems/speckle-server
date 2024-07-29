<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    v-if="cleanReadmeHtml.length"
    :class="proseClasses"
    v-html="cleanReadmeHtml"
  ></div>
  <div v-else class="italic text-center">No readme found</div>
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
  'dark:prose-invert'
])
</script>
