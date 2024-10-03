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
import { proseClasses, useMarkdown } from '~/lib/common/composables/markdown'
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
</script>
