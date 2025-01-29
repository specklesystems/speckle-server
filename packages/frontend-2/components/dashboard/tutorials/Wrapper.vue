<template>
  <section>
    <h2 class="text-heading-sm text-foreground-2 mb-4">Tutorials</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <DashboardTutorialsCard
        v-for="tutorialItem in tutorialItems"
        :key="tutorialItem.title"
        :tutorial-item="tutorialItem"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { tutorials } from '~/lib/dashboard/helpers/tutorials'

const tutorialItems = shallowRef(tutorials)
</script>
