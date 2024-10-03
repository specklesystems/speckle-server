<template>
  <div class="mt-1 mb-1">
    <ViewerLayoutPanel @close="$emit('close')">
      <div v-if="isEmpty">
        <ViewerDataInsightsEmpty />
      </div>
      <div v-else>
        <ViewerDataInsightsGraph />
      </div>
    </ViewerLayoutPanel>
  </div>
</template>

<script setup lang="ts">
import type { AutomateViewerPanel_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'
import { useSelectionUtilities } from '~/lib/viewer/composables/ui'

defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const isEmpty = false

const { objects } = useSelectionUtilities()
</script>
