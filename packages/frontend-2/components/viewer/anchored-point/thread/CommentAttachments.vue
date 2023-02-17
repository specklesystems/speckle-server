<template>
  <div class="flex flex-col w-full items-start">
    <CommonTextLink
      v-for="attachment in attachments.text.attachments || []"
      :key="attachment.id"
      :icon-left="resolveIconComponent(attachment)"
      size="sm"
    >
      <span class="truncate relative bottom-0.5">{{ attachment.fileName }}</span>
    </CommonTextLink>
  </div>
</template>
<script setup lang="ts">
import {
  ArchiveBoxIcon,
  DocumentIcon,
  GifIcon,
  PaperClipIcon,
  PhotoIcon
} from '@heroicons/vue/24/solid'
import { Get } from 'type-fest'
import { graphql } from '~~/lib/common/generated/gql'
import { ThreadCommentAttachmentFragment } from '~~/lib/common/generated/gql/graphql'

type AttachmentFile = NonNullable<
  Get<ThreadCommentAttachmentFragment, 'text.attachments[0]'>
>

graphql(`
  fragment ThreadCommentAttachment on Comment {
    text {
      attachments {
        id
        fileName
        fileType
        fileSize
      }
    }
  }
`)

defineProps<{
  attachments: ThreadCommentAttachmentFragment
}>()

const resolveIconComponent = (attachment: AttachmentFile) => {
  switch (attachment.fileType) {
    case 'png':
    case 'jpg':
    case 'jpeg':
      return PhotoIcon
    case 'gif':
      return GifIcon
    case 'pdf':
      return DocumentIcon
    case 'zip':
      return ArchiveBoxIcon
    default:
      return PaperClipIcon
  }
}
</script>
