<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span class="label font-bold">Versions</span>
      </div>
    </template>
    <template #bottom>
      <span class="h2 font-bold">123</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'
</script>
