<template>
  <v-card>
    <v-toolbar>
      <v-toolbar-title>
        {{ attachment.fileName }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn class="primary" @click="downloadBlob()">
        <v-icon class="mr-2">mdi-download</v-icon>
        {{ prettyFileSize(attachment.fileSize) }}
      </v-btn>
    </v-toolbar>
    <template v-if="isImage && !error">
      <v-img min-width="100%" min-height="100px" :src="blobUrl">
        <template #placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular
              indeterminate
              color="grey lighten-5"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>
    </template>
    <template v-else-if="!error">
      <v-card-text class="mt-4">
        <v-icon small class="mr-2">mdi-alert</v-icon>
        Be cautious when downloading! Attachments are not scanned for harmful content.
      </v-card-text>
    </template>
    <template v-else>
      <v-card-text class="mt-4">
        <v-icon small class="mr-2">mdi-alert</v-icon>
        Failed to preview attachment.
      </v-card-text>
    </template>
  </v-card>
</template>
<script>
import Vue from 'vue'
import { prettyFileSize } from '@/main/lib/common/file-upload/fileUploadHelper'
import {
  getBlobUrl,
  downloadBlobWithUrl
} from '@/main/lib/common/file-upload/blobStorageApi'
import { useCommitObjectViewerParams } from '@/main/lib/viewer/commit-object-viewer/stateManager'

export default Vue.extend({
  name: 'CommentThreadAttachmentPreview',
  props: {
    attachment: {
      type: Object,
      default: () => null,
      required: true
    },
    isOpen: { type: Boolean, required: true }
  },
  setup() {
    const { streamId, resourceId } = useCommitObjectViewerParams()
    return { streamId, resourceId }
  },
  data: () => ({
    prettyFileSize,
    blobUrl: null,
    error: null
  }),
  computed: {
    isImage() {
      switch (this.attachment.fileType) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return true
        default:
          return false
      }
    }
  },
  watch: {
    isOpen(val) {
      if (!val && this.blobUrl) {
        window.URL.revokeObjectURL(this.blobUrl)
      }
    }
  },
  async mounted() {
    try {
      if (this.isImage) {
        this.blobUrl = await getBlobUrl(this.attachment.id, {
          streamId: this.streamId
        })
      }
    } catch (e) {
      this.error = e
    }
  },
  methods: {
    async downloadBlob() {
      try {
        const { id, fileName, streamId } = this.attachment
        await downloadBlobWithUrl(id, fileName, { streamId })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
      this.$emit('close')
    }
  }
})
</script>
