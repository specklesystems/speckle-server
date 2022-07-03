<template>
  <v-card>
    <v-toolbar>
      <v-toolbar-title>
        {{ attachment.fileName }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn class="primary" @click="downloadBlob">
        <v-icon class="mr-2">mdi-download</v-icon>
        {{ prettyFileSize(attachment.fileSize) }}
      </v-btn>
    </v-toolbar>
    <!-- {{ attachment }}
    <br />
    {{ blobUrl }} -->
    <template v-if="isImage">
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
    <template v-else>
      <v-card-text class="mt-4">
        <v-icon small class="mr-2">mdi-alert</v-icon>
        Be cautious when downloading! Attachments are not scanned for harmful content.
      </v-card-text>
    </template>
  </v-card>
</template>
<script lang="ts">
import Vue from 'vue'
import { Nullable } from '@/helpers/typeHelpers'
import { prettyFileSize } from '@/main/lib/common/file-upload/fileUploadHelper'
import {
  getBlobUrl,
  downloadBlobWithUrl
} from '@/main/lib/common/file-upload/blobStorageApi'

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
  data: () => ({
    prettyFileSize,
    blobUrl: null as Nullable<string>
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
    console.log('mounted', this.attachment)
    if (this.isImage) {
      this.blobUrl = await getBlobUrl(this.attachment.id, {
        streamId: this.$route.params.streamId
      })
    }
  },
  methods: {
    downloadBlob() {
      const { id, fileName, streamId } = this.attachment
      downloadBlobWithUrl(id, fileName, { streamId })
      this.$emit('close')
    }
  }
})
</script>
