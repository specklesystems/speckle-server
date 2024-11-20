<template>
  <section v-if="!error">
    <h2 class="text-heading-sm text-foreground-2 mb-4">Blog</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <DashboardBlogCard
        v-for="webflowItem in webflowItems"
        :key="webflowItem.id"
        :webflow-item="webflowItem"
      />
    </div>
  </section>
  <section v-else />
</template>

<script setup lang="ts">
import type { WebflowItem } from '~/lib/dashboard/helpers/types'

const logger = useLogger()

const { data: webflowData, error } = await useAsyncData<{
  items: WebflowItem[]
}>('webflow-items', () =>
  $fetch<{ items: WebflowItem[] }>('/api/webflow', {
    onResponseError({ response }) {
      logger.error('API Response Error:', response.status, response.statusText)
    }
  })
)

const webflowItems = computed(() => webflowData.value?.items || [])
</script>
