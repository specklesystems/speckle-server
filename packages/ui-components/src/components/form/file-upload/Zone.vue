<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <div ref="fileUploadZone" class="file-upload-zone">
    <slot
      :is-dragging-files="isOverDropZone"
      :open-file-picker="triggerPicker"
      :activator-on="{ click: triggerPicker }"
    />
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @click.stop
      @change="onInputChange"
    />
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { useDropZone } from '@vueuse/core'
import { computed, ref } from 'vue'
import { usePrepareUploadableFiles } from '~~/src/composables/form/fileUpload'
import type { UploadableFileItem } from '~~/src/composables/form/fileUpload'

const emit = defineEmits<{
  (e: 'files-selected', v: { files: UploadableFileItem[] }): void
}>()

const props = withDefaults(
  defineProps<{
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
     */
    accept?: string
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/multiple
     */
    multiple?: boolean
    /**
     * Max file size in bytes
     */
    sizeLimit?: number
    /**
     * Max file count if 'multiple' is set
     */
    countLimit?: number
    disabled?: boolean
  }>(),
  {
    sizeLimit: 1024 * 1024 * 100 // 100mb
  }
)

const fileUploadZone = ref(null as Nullable<HTMLDivElement>)
const fileInput = ref(null as Nullable<HTMLInputElement>)

const { buildUploadableFiles } = usePrepareUploadableFiles({
  sizeLimit: computed(() => props.sizeLimit),
  countLimit: computed(() => props.countLimit),
  accept: computed(() => props.accept),
  multiple: computed(() => props.multiple),
  disabled: computed(() => props.disabled)
})
const handleIncomingFiles = (files: File[]) => {
  const fileItems = buildUploadableFiles(files)
  if (!fileItems?.length) return
  emit('files-selected', { files: fileItems })
}

const { isOverDropZone } = useDropZone(fileUploadZone, (files) => {
  if (!files?.length) return
  handleIncomingFiles(files)
})

const onInputChange = () => {
  const input = fileInput.value
  if (!input) return

  const files = [...(input.files || [])]
  input.value = '' // Resetting value

  if (!files.length) return
  handleIncomingFiles(files)
}

const triggerPicker = () => {
  fileInput.value?.click()
}

defineExpose({
  triggerPicker
})
</script>
