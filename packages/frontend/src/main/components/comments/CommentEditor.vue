<template>
  <div class="comment-editor">
    <file-upload-zone
      ref="uploadZone"
      v-slot="{ isFileDrag }"
      :size-limit="blobSizeLimitBytes"
      :count-limit="countLimit"
      :accept="acceptValue"
      :disabled="disabled"
      multiple
      @files-selected="onFilesSelected"
    >
      <smart-text-editor
        v-model="doc"
        :class="['elevation-5 rounded-xl', isFileDrag ? 'dragging-files' : '']"
        :autofocus="autofocus"
        min-width
        :placeholder="placeholder"
        :schema-options="editorSchemaOptions"
        :disabled="disabled"
        :hide-toolbar="addingComment"
        @submit="onSubmit"
      />
    </file-upload-zone>
    <file-upload-progress
      v-if="currentFiles.length"
      :items="currentFiles"
      class="mt-2"
      :disabled="disabled"
      @delete="onUploadDelete"
    />
  </div>
</template>
<script lang="ts">
import SmartTextEditor from '@/main/components/common/text-editor/SmartTextEditor.vue'
import {
  CommentEditorValue,
  SMART_EDITOR_SCHEMA
} from '@/main/lib/viewer/comments/commentsHelper'
import Vue, { PropType } from 'vue'
import FileUploadZone from '@/main/components/common/file-upload/FileUploadZone.vue'
import {
  FilesSelectedEvent,
  FileUploadDeleteEvent,
  isUploadProcessed,
  UniqueFileTypeSpecifier
} from '@/main/lib/common/file-upload/fileUploadHelper'
import FileUploadProgress from '@/main/components/common/file-upload/FileUploadProgress.vue'
import { UploadFileItem } from '@/main/lib/common/file-upload/fileUploadHelper'
import { differenceBy } from 'lodash'
import { useQuery } from '@vue/apollo-composable'
import { ServerInfoBlobSizeLimitDocument } from '@/graphql/generated/graphql'
import { deleteBlob, uploadFiles } from '@/main/lib/common/file-upload/blobStorageApi'
import { JSONContent } from '@tiptap/core'
import { computed } from 'vue'

type FileUploadZoneInstance = InstanceType<typeof FileUploadZone>

export default Vue.extend({
  name: 'CommentEditor',
  components: {
    SmartTextEditor,
    FileUploadZone,
    FileUploadProgress
  },
  props: {
    value: {
      type: Object as PropType<CommentEditorValue>,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    addingComment: {
      type: Boolean,
      default: false
    },
    streamId: {
      type: String,
      required: true
    },
    autofocus: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    const { result } = useQuery(ServerInfoBlobSizeLimitDocument)
    const blobSizeLimitBytes = computed(
      () => result.value?.serverInfo.configuration.blobSizeLimitBytes
    )
    return { blobSizeLimitBytes }
  },
  data() {
    return {
      editorSchemaOptions: SMART_EDITOR_SCHEMA,
      // fileSizeLimit: 1024 * 1024 * 25, // 25MB
      countLimit: 5, // if it's more than 5, just zip it up
      acceptValue: [
        UniqueFileTypeSpecifier.AnyImage,
        UniqueFileTypeSpecifier.AnyVideo,
        '.pdf',
        '.zip',
        '.pptx',
        '.ifc',
        '.dwg',
        '.dxf',
        '.3dm',
        '.ghx',
        '.gh',
        '.rvt',
        '.pla',
        '.pln',
        '.obj',
        '.blend',
        '.3ds',
        '.max',
        '.mtl',
        '.stl',
        '.md',
        '.txt',
        '.csv',
        '.xlsx',
        '.xls',
        '.doc',
        '.docx',
        '.svg',
        '.eps',
        '.gwb',
        '.skp'
      ].join(',')
    }
  },
  computed: {
    realValue: {
      get(): CommentEditorValue {
        return this.value
      },
      set(newVal: CommentEditorValue) {
        this.$emit('input', newVal)
      }
    },
    doc: {
      get(): JSONContent {
        return this.value.doc
      },
      set(newVal: JSONContent) {
        this.realValue = {
          ...this.realValue,
          doc: newVal
        }
      }
    },
    currentFiles: {
      get(): UploadFileItem[] {
        return this.value.attachments
      },
      set(newVal: UploadFileItem[]) {
        this.realValue = {
          ...this.realValue,
          attachments: newVal
        }
      }
    },
    placeholder(): string {
      return 'Press enter to send'
    },
    anyAttachmentsProcessing(): boolean {
      return this.currentFiles.some((a) => !isUploadProcessed(a))
    }
  },
  watch: {
    anyAttachmentsProcessing(newVal: boolean, oldVal: boolean) {
      if (newVal !== oldVal) {
        this.$emit('attachments-processing', newVal)
      }
    }
  },
  beforeDestroy() {
    // Delete attachments that weren't posted
    for (const currentFile of this.currentFiles.slice()) {
      if (currentFile.inUse) continue
      this.popUpload(currentFile.id)
    }
  },
  methods: {
    addAttachments(): void {
      ;(this.$refs.uploadZone as FileUploadZoneInstance).triggerPicker()
    },
    onSubmit(e: unknown) {
      this.$emit('submit', e)
    },
    onFilesSelected(e: FilesSelectedEvent) {
      const remainingCount = Math.max(0, this.countLimit - this.currentFiles.length)
      if (!remainingCount) return

      const incomingFiles = e.files
      const currentFiles = this.currentFiles
      const newFiles = differenceBy(incomingFiles, currentFiles, (f) => f.id)
      if (!newFiles.length) return

      const limitedFiles = newFiles.slice(0, remainingCount)
      const newUploads = Object.values(
        uploadFiles(limitedFiles, { streamId: this.streamId }, (uploadedFiles) => {
          // Delete files that were uploaded, but already removed from attachments
          for (const [id, file] of Object.entries(uploadedFiles)) {
            if (
              file.result?.blobId &&
              this.currentFiles.findIndex((f) => f.id === id) === -1 &&
              !file.inUse
            ) {
              this.deleteBlobInBg(file.result?.blobId)
            }
          }
        })
      )
      this.currentFiles = [...this.currentFiles, ...newUploads]
    },
    popUpload(fileId: string) {
      const fileIdx = this.currentFiles.findIndex((f) => f.id === fileId)
      if (fileIdx === -1) return

      // Remove from array
      const [removedFile] = this.currentFiles.splice(fileIdx, 1) || []

      // Delete from blob storage
      if (removedFile.result?.blobId) {
        this.deleteBlobInBg(removedFile.result.blobId)
      }
    },
    deleteBlobInBg(blobId: string): void {
      deleteBlob(blobId, { streamId: this.streamId }).catch(console.error)
    },
    onUploadDelete(e: FileUploadDeleteEvent) {
      const { id } = e
      this.popUpload(id)
    }
  }
})
</script>
<style lang="scss" scoped>
:deep(.smart-text-editor) {
  // transparent border, so we don't get a layout shift
  border: 2px solid transparent;

  &.dragging-files {
    border: 2px solid rgb(0, 193, 0);
  }
}
</style>
