<template>
  <div class="comment-attachments d-flex">
    <div class="text-caption d-flex flex-column">
      <a
        v-for="attachment in attachments"
        :key="attachment.url"
        v-tooltip="attachment.fileName"
        href="javascript:;"
        class="my-1"
        @click="onAttachmentClick(attachment)"
      >
        <v-icon small color="white">mdi-paperclip</v-icon>
        {{ attachment.fileName.substring(0, 22) }}
        {{ attachment.fileName.length > 20 ? '...' : '' }}
      </a>
    </div>
  </div>
</template>
<script lang="ts">
import { BlobMetadata } from '@/graphql/generated/graphql'
import { downloadBlobWithUrl } from '@/main/lib/common/file-upload/blobStorageApi'
import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'CommentThreadReplyAttachments',
  props: {
    attachments: {
      type: Array as PropType<Array<BlobMetadata>>,
      required: true
    }
  },
  methods: {
    onAttachmentClick(a: BlobMetadata) {
      const { id, fileName, streamId } = a
      downloadBlobWithUrl(id, fileName, { streamId })
    }
  }
})
</script>
