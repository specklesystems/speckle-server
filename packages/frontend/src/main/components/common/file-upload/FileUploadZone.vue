<template>
  <div
    class="file-upload-zone"
    @mouseover="isHover = true"
    @mouseleave="isHover = false"
    @dragenter.prevent="isFileDrag = true"
    @dragover.prevent="isFileDrag = true"
    @dragleave.prevent="isFileDrag = false"
    @drop.prevent="onDrop"
  >
    <slot
      :is-hover="isHover"
      :is-file-drag="isFileDrag"
      :activator-on="activatorOn"
      :open-file-picker="openFilePicker"
    />
    <input
      ref="fileInput"
      type="file"
      class="d-none"
      :accept="accept"
      :multiple="multiple"
      @change="onFileSelect"
    />
  </div>
</template>
<script lang="ts">
import { Optional } from '@/helpers/typeHelpers'
import {
  FileTypeSpecifier,
  validateFileType,
  isFileTypeSpecifier,
  UploadableFileItem,
  FileTooLargeError,
  prettyFileSize,
  generateFileId
} from '@/main/lib/common/file-upload/fileUploadHelper'
import Vue, { PropType } from 'vue'

/**
 * Generic/re-usable file upload zone. Files can be dragged and dropped onto it.
 * If you want to trigger the file picker dialog, invoke the openFilePicker function available
 * in the default template's scoped slots.
 * Similarly you can attach the default template's `activatorOn` prop to any element
 * that can be clicked with 'v-on' and on click it will trigger
 * the file picker dialog.
 *
 * If you want the dialog outside of the template, you can also do:
 * this.$refs.uploadZone.triggerPicker() // triggered from the parent
 *
 * Templates:
 * #default: { isFileDrag, isHover, activatorOn, openFilePicker }
 *
 * Events:
 * @files-selected: FilesSelectedEvent
 */

/**
 * TODO: <input type=file> unhidden w/ label, for accessibility. Currently it's not needed
 * for comment attachments
 */
export default Vue.extend({
  name: 'FileUploadZone',
  props: {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
     */
    accept: {
      type: String as PropType<Optional<string>>,
      default: undefined
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/multiple
     */
    multiple: {
      type: Boolean,
      default: false
    },
    /**
     * Max file size in bytes
     */
    sizeLimit: {
      type: Number,
      default: 1024 * 1024 * 100 // 100mb
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    isHover: false,
    isFileDrag: false
  }),
  computed: {
    fileTypeSpecifiers(): Optional<FileTypeSpecifier[]> {
      if (!this.accept) return undefined
      const specifiers = this.accept
        .split(',')
        .map((s) => (isFileTypeSpecifier(s) ? s : null))
        .filter((s): s is FileTypeSpecifier => s !== null)

      return specifiers.length ? specifiers : undefined
    },
    activatorOn(): Record<string, () => void> {
      return {
        click: () => {
          this.triggerPicker()
        }
      }
    },
    openFilePicker(): () => void {
      return () => this.triggerPicker()
    }
  },
  methods: {
    /**
     * Trigger the file picker dialog
     */
    triggerPicker() {
      ;(this.$refs.fileInput as HTMLElement).click()
    },
    onDrop(e: DragEvent) {
      if (!e.dataTransfer?.files) return
      this.handleIncomingFiles([...e.dataTransfer.files])
    },
    onFileSelect(e: Event) {
      const typedTarget = e.target as HTMLInputElement
      const files = [...(typedTarget.files || [])]
      typedTarget.value = '' // Resetting value

      if (!files || !files.length) return
      this.handleIncomingFiles(files)
    },
    /**
     * Validate and process newly selected files
     */
    handleIncomingFiles(files: File[]) {
      this.isFileDrag = false
      if (this.disabled) return

      const processedFiles = this.buildUploadableFiles(files)
      if (processedFiles.length) {
        this.$emit('files-selected', { files: processedFiles })
      }
    },
    /**
     * Validate files and convert them to UploadableFileItem
     */
    buildUploadableFiles(files: File[]): UploadableFileItem[] {
      const results: UploadableFileItem[] = []
      const allowedTypes = this.fileTypeSpecifiers

      for (const file of files) {
        const id = generateFileId(file)
        const countLimit = !this.multiple ? 1 : undefined

        // skip file, if it's selected twice somehow
        if (results.find((r) => r.id === id)) continue

        // Only allow a single file if !multiple
        if (countLimit && results.length >= countLimit) {
          break
        }

        if (allowedTypes) {
          const validationResult = validateFileType(file, allowedTypes)
          if (validationResult instanceof Error) {
            results.push({
              file,
              id,
              error: validationResult
            })
            continue
          }
        }

        if (file.size > this.sizeLimit) {
          results.push({
            file,
            id,
            error: new FileTooLargeError(
              `The selected file's size (${prettyFileSize(
                file.size
              )}) is too big (over ${prettyFileSize(this.sizeLimit)})`
            )
          })
          continue
        }

        results.push({ file, id, error: null })
      }

      return results
    }
  }
})
</script>
