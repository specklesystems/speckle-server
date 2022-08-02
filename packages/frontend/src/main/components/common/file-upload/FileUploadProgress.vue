<template>
  <div class="file-upload-progress d-flex flex-column">
    <file-upload-progress-row
      v-for="item in items"
      :key="item.id"
      :item="item"
      :disabled="disabled"
      class="mb-1"
      @delete="$emit('delete', $event)"
    />
  </div>
</template>
<script lang="ts">
import FileUploadProgressRow from '@/main/components/common/file-upload/FileUploadProgressRow.vue'
import { UploadFileItem } from '@/main/lib/common/file-upload/fileUploadHelper'
import Vue, { PropType } from 'vue'

/**
 * Render UploadFileItem progress
 *
 * Events:
 * @delete: FileUploadDeleteEvent
 */
export default Vue.extend({
  name: 'FileUploadProgress',
  components: {
    FileUploadProgressRow
  },
  props: {
    items: {
      type: Array as PropType<UploadFileItem[]>,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
})
</script>
<style lang="scss" scoped>
:deep(.file-upload-progress-row:last-of-type) {
  margin-bottom: 0 !important;
}
</style>
