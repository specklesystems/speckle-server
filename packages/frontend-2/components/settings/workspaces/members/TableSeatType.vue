<template>
  <div
    v-tippy="description"
    class="text-foreground border-b border-dashed border-outline-5 max-w-max select-none capitalize"
  >
    {{ seatType }}
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceSeatType, WorkspaceRoles } from '@speckle/shared'
import { WorkspaceSeatTypeDescription } from '~/lib/settings/helpers/constants'

const props = defineProps<{
  seatType: WorkspaceSeatType
  role: WorkspaceRoles
}>()

const description = computed(
  () => WorkspaceSeatTypeDescription[props.role][props.seatType]
)
</script>
