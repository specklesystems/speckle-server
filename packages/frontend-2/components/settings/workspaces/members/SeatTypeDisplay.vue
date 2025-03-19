<template>
  <span class="text-foreground">
    <div
      v-tippy="description"
      class="border-b border-dashed border-outline-5 max-w-max select-none capitalize"
    >
      {{ seatType }}
    </div>
  </span>
</template>

<script setup lang="ts">
import { WORKSPACE_SEAT_TYPE_DESCRIPTIONS } from '~/lib/settings/helpers/types'
import type { WorkspaceSeatType } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  seatType: WorkspaceSeatType
}>()

const description = computed(() => WORKSPACE_SEAT_TYPE_DESCRIPTIONS[props.seatType])
</script>
