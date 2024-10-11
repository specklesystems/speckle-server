<template>
  <div class="flex flex-col w-full items-start pt-2">
    <CommonTextLink
      v-for="attachment in attachments.text.attachments || []"
      :key="attachment.id"
      :icon-left="resolveIconComponent(attachment)"
      @click="() => onAttachmentClick(attachment)"
    >
      <span class="truncate relative text-xs pl-1">
        {{ attachment.fileName }}
      </span>
    </CommonTextLink>
    <LayoutDialog v-model:open="dialogOpen" max-width="lg" :buttons="dialogButtons">
      <template #header>
        {{ dialogAttachment ? dialogAttachment.fileName : 'Attachment' }}
      </template>
      <template v-if="dialogAttachment">
        <div class="flex flex-col space-y-2">
          <div class="flex justify-center text-foreground">
            <template v-if="dialogAttachmentError">
              <span class="inline-flex space-x-2 items-center">
                <ExclamationTriangleIcon class="w-4 h-4" />
                <span>Failed to preview attachment</span>
              </span>
            </template>
            <template
              v-else-if="isImage(dialogAttachment) && dialogAttachmentObjectUrl"
            >
              <img :src="dialogAttachmentObjectUrl" alt="Attachment preview" />
            </template>
            <template v-else>
              <span class="inline-flex space-x-2 items-center">
                <ExclamationTriangleIcon class="w-4 h-4" />
                <span>
                  Be cautious when downloading! Attachments are not scanned for harmful
                  content.
                </span>
              </span>
            </template>
          </div>
        </div>
      </template>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import {
  ArchiveBoxIcon,
  DocumentIcon,
  GifIcon,
  PaperClipIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'
import type { Get } from 'type-fest'
import { ensureError } from '@speckle/shared'
import type { Nullable, Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { ThreadCommentAttachmentFragment } from '~~/lib/common/generated/gql/graphql'
import { prettyFileSize } from '~~/lib/core/helpers/file'
import { useFileDownload } from '~~/lib/core/composables/fileUpload'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { LayoutDialogButton } from '@speckle/ui-components'

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

const props = defineProps<{
  attachments: ThreadCommentAttachmentFragment
  projectId: string
}>()

const { getBlobUrl, download } = useFileDownload()
const { triggerNotification } = useGlobalToast()

const dialogOpen = ref(false)
const dialogAttachment = ref(null as Nullable<AttachmentFile>)
const dialogAttachmentError = ref(null as Nullable<Error>)
const dialogAttachmentObjectUrl = ref(null as Nullable<string>)

const isImage = (attachment: AttachmentFile) => {
  switch (attachment.fileType) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return true
    default:
      return false
  }
}

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

const onAttachmentClick = (attachment: AttachmentFile) => {
  dialogAttachment.value = attachment
  dialogOpen.value = true
}

const onDownloadClick = async () => {
  if (!dialogAttachment.value) return

  try {
    const { id, fileName } = dialogAttachment.value
    await download({ blobId: id, fileName, projectId: props.projectId })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Download failed',
      description: ensureError(e).message
    })
  }
}

const dialogButtons = computed((): Optional<LayoutDialogButton[]> => {
  if (!dialogAttachment.value) return undefined

  const button: LayoutDialogButton = {
    text: dialogAttachment.value.fileSize
      ? prettyFileSize(dialogAttachment.value.fileSize)
      : 'Download',
    props: {
      iconLeft: ArrowDownTrayIcon
    },
    onClick: () => {
      onDownloadClick()
    }
  }

  return [button]
})

watch(dialogOpen, (newIsOpen) => {
  if (!newIsOpen) {
    dialogAttachmentError.value = null

    if (dialogAttachmentObjectUrl.value) {
      URL.revokeObjectURL(dialogAttachmentObjectUrl.value)
      dialogAttachmentObjectUrl.value = null
    }
  } else if (dialogAttachment.value) {
    if (isImage(dialogAttachment.value)) {
      getBlobUrl({ blobId: dialogAttachment.value.id, projectId: props.projectId })
        .then((url) => {
          dialogAttachmentObjectUrl.value = url
        })
        .catch((err) => {
          dialogAttachmentError.value = ensureError(err)
        })
    }
  }
})
</script>
