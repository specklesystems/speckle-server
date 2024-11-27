<template>
  <div class="py-3 md:py-6">
    <component :is="currentStepComponent" />
  </div>
</template>
<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { currentStepComponent } = useWorkspacesWizard()
</script>
