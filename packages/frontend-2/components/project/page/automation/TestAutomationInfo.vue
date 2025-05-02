<template>
  <div>
    <h2 class="h6 font-medium mb-6">Configuration</h2>
    <CommonCard class="bg-foundation" title="Environment">
      <p>{{ projectId }}</p>
      <p>{{ automationId }}</p>
    </CommonCard>
    <FormButton>Using test automations</FormButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  projectId: string
  automationId: string
}>()
</script>
