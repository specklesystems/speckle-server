<template>
  <div class="flex-1 flex flex-col gap-6 items-center justify-center">
    <IllustrationEmptystateFilters class="-mt-8" />
    <div class="text-foreground-2 text-body-xs">There are no filters, yet.</div>
    <FormButton @click="$emit('addFilter')">Add filter</FormButton>
  </div>
</template>

<script setup lang="ts">
import { FormButton } from '@speckle/ui-components'

defineEmits<{
  addFilter: []
}>()
</script>
