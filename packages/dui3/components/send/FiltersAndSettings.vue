<template>
  <div class="space-y-2">
    <FilterListSelect @update:filter="updateFilter" />
    <!-- Settings maybe later? -->
  </div>
</template>
<script setup lang="ts">
import { ISendFilter } from 'lib/models/card/send'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const updateFilter = (filter: ISendFilter) => {
  // TODO: something like hostApp.validateSendFilter()
  // which should return a bool and a reason if invalid
  emit('update:filter', filter)
}
</script>
