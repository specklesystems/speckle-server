<template>
  <ProjectPageSettingsBlock title="Project Info">
    <template #logo><Cog6ToothIcon class="h-5 w-5" /></template>
    <FormTextInput
      name="projectName"
      label="Project Name"
      placeholder="Project Name"
      show-label
      color="foundation"
    />
    <FormTextArea
      name="projectDescription"
      label="Project Description"
      placeholder="Project Description"
      show-label
      color="foundation"
    />
    <template #buttons>
      <FormButton text disabled>Cancel</FormButton>
      <FormButton disabled>Update</FormButton>
    </template>
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
</script>
