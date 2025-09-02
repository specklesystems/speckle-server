<template>
  <div class="flex-1 flex flex-col gap-6 items-center justify-center">
    <IllustrationEmptystateFiltersTab class="" />
    <div class="text-foreground-2 text-heading-sm mt-2 p-0">
      There are no filters, yet.
    </div>
    <FormButton color="outline" @click="$emit('addFilter')">Add filter</FormButton>
  </div>
</template>

<script setup lang="ts">
import { FormButton } from '@speckle/ui-components'

defineEmits<{
  addFilter: []
}>()
</script>
