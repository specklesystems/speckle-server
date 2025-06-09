<template>
  <div
    v-tippy="description"
    class="text-foreground border-b border-dashed border-outline-5 max-w-max select-none capitalize"
  >
    {{ seatType }}
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceRoles, MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceSeatTypeDescription } from '~/lib/settings/helpers/constants'
import { WorkspaceSeatType } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  seatType: MaybeNullOrUndefined<WorkspaceSeatType>
  role: WorkspaceRoles
}>()

const description = computed(
  () =>
    WorkspaceSeatTypeDescription[props.role][props.seatType || WorkspaceSeatType.Viewer]
)
</script>
