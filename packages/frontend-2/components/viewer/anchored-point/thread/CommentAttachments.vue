<template>
  <div>
    <div v-if="attachmentList.length > 0" class="flex flex-col w-full items-start pt-1">
      <CommonTextLink
        v-for="attachment in attachmentList"
        :key="attachment.id"
        class="!text-foreground hover:!text-foreground-2"
        @click="() => onAttachmentClick(attachment)"
      >
        <PaperClipIcon class="w-4 h-4 mr-1" />
        <span class="truncate relative text-body-2xs">
          {{ attachment.fileName }}
        </span>
      </CommonTextLink>
    </div>
    <LayoutDialog v-model:open="dialogOpen" max-width="lg" :buttons="dialogButtons">
      <template #header>
        {{ dialogAttachment ? dialogAttachment.fileName : 'Attachment' }}
      </template>
      <template v-if="dialogAttachment">
        <div class="flex flex-col space-y-2">
          <div class="flex justify-center text-foreground text-body-xs py-4">
            <span
              v-if="dialogAttachmentError"
              class="inline-flex space-x-2 items-center"
            >
              Failed to load attachment preview
            </span>
            <template
              v-else-if="isImage(dialogAttachment) && dialogAttachmentObjectUrl"
            >
              <img :src="dialogAttachmentObjectUrl" alt="Attachment preview" />
            </template>
            <template v-else>
              <span class="inline-flex space-x-4 items-center">
                <ExclamationTriangleIcon class="w-6 h-6" />
                <span>
                  Please note: This file is user-uploaded and has not been scanned for
                  security. Download at your own discretion.
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
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  PaperClipIcon
} from '@heroicons/vue/24/outline'
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

const attachmentList = computed(() => props.attachments.text.attachments || [])

const dialogButtons = computed((): Optional<LayoutDialogButton[]> => {
  if (!dialogAttachment.value) return undefined

  const button: LayoutDialogButton = {
    text: dialogAttachment.value.fileSize
      ? prettyFileSize(dialogAttachment.value.fileSize)
      : 'Download',
    props: {
      iconLeft: ArrowDownTrayIcon,
      color: 'outline'
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
