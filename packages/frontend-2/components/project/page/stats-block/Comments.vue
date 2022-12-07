<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex space-x-1.5 items-center">
        <ChatBubbleOvalLeftIcon class="h-5 w-5" />
        <span class="label font-bold">Total Comments</span>
      </div>
    </template>
    <template #bottom>
      <span class="h2 font-bold">32</span>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid'
</script>
