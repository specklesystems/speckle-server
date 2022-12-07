<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <CubeIcon class="h-5 w-5" />
        <span class="label font-bold">Total Models</span>
      </div>
    </template>
    <template #bottom>
      <span class="h2 font-bold">8</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/solid'
</script>
