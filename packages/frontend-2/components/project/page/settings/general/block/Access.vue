<template>
  <ProjectPageSettingsBlock title="Access">
    <template #logo><LockClosedIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>
        Choose how you want to share your projects with others. Select the option that
        best suits your needs:
      </p>
    </template>
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { LockClosedIcon } from '@heroicons/vue/24/outline'
</script>
