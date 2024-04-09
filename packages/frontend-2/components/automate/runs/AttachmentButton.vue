<template>
  <FormButton v-tippy="fileInfo.name" text @click="onDownloadClick">
    <span :class="`${restrictWidth ? 'max-w-[5rem]' : ''} truncate`">
      {{ fileInfo.name }}
    </span>
    <PaperClipIcon class="w-3 h-3 text-primary" />
  </FormButton>
</template>
<script setup lang="ts">
import { PaperClipIcon } from '@heroicons/vue/20/solid'
import { useQuery } from '@vue/apollo-composable'
import { projectBlobInfoQuery } from '~~/lib/projects/graphql/queries'
import { useFileDownload } from '~~/lib/core/composables/fileUpload'
import { ensureError } from '@speckle/shared'

const { download } = useFileDownload()
const { triggerNotification } = useGlobalToast()

const props = withDefaults(
  defineProps<{
    blobId: string
    projectId: string
    restrictWidth?: boolean
  }>(),
  {
    restrictWidth: true
  }
)

const { result } = useQuery(projectBlobInfoQuery, () => ({
  projectId: props.projectId,
  blobId: props.blobId
}))

const fileInfo = computed(() => {
  return {
    name: result.value?.project?.blob?.fileName,
    type: result.value?.project?.blob?.fileType,
    size: result.value?.project?.blob?.fileSize
  }
})

const onDownloadClick = async () => {
  try {
    await download({
      blobId: props.blobId,
      fileName: fileInfo.value.name as string,
      projectId: props.projectId
    })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Download failed',
      description: ensureError(e).message
    })
  }
}
</script>
