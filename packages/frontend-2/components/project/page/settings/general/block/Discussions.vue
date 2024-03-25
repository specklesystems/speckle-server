<template>
  <ProjectPageSettingsBlock title="Discussions">
    <template #logo><ChatBubbleLeftRightIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>Control who can leave comments on your projects:</p>
    </template>
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
</script>
