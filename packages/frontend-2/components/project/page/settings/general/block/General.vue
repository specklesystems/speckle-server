<template>
  <ProjectPageSettingsBlock title="General">
    <template #logo><Cog6ToothIcon class="h-5 w-5" /></template>
    <FormTextInput
      name="email"
      label="Project Name"
      placeholder="ProjectName"
      show-label
    />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
</script>
