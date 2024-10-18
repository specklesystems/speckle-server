<template>
  <section v-if="!error">
    <h2 class="text-heading-sm text-foreground-2 mb-4">News &amp; tutorials</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <DashboardTutorialsCard
        v-for="tutorial in tutorials"
        :key="tutorial.id"
        :tutorial="tutorial"
      />
    </div>
  </section>
  <section v-else />
</template>

<script setup lang="ts">
import type { TutorialItem } from '~/lib/dashboard/helpers/types'

const logger = useLogger()

const { data: tutorialData, error } = await useFetch<{
  items: TutorialItem[]
}>('/api/tutorials', {
  onResponseError({ response }) {
    logger.error('API Response Error:', response.status, response.statusText)
  }
})

const tutorials = computed(() => tutorialData.value?.items || [])
</script>
