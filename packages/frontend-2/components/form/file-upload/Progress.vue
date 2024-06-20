<template>
  <div class="flex flex-col space-y-2">
    <FormFileUploadProgressRow
      v-for="item in items"
      :key="item.id"
      :item="item"
      :disabled="disabled"
      @delete="$emit('delete', { id: item.id })"
    />
  </div>
</template>
<script setup lang="ts">
import type { UploadFileItem } from '~~/lib/form/composables/fileUpload'

defineEmits<{
  (e: 'delete', v: { id: string }): void
}>()

defineProps<{
  items: UploadFileItem[]
  disabled?: boolean
}>()
</script>
