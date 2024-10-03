<template>
  <div class="mt-1 mb-1">
    SEXY GRAPHS
    <div v-for="object in objects" :key="object.id">
      {{ object.id }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AutomateViewerPanel_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'
import { useSelectionUtilities } from '~/lib/viewer/composables/ui'

defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const { objects } = useSelectionUtilities()
</script>
