<template>
  <div
    v-tippy="description"
    class="text-foreground border-b border-dashed border-outline-5 max-w-max select-none capitalize"
  >
    {{ seatType }}
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceSeatType } from '@speckle/shared'
import { WorkspaceSeatTypeDescriptions } from '~/lib/settings/helpers/constants'

const props = defineProps<{
  seatType: WorkspaceSeatType
}>()

const description = computed(() => WorkspaceSeatTypeDescriptions[props.seatType])
</script>
