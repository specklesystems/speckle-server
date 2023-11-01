<template>
	<div class="">
		<FormButton v-tippy="fileInfo.name" text size="xs" @click="onDownloadClick">
			<span class="max-w-[5rem] truncate">{{ fileInfo.name }}</span>
			<PaperClipIcon class="w-3 h-3 text-primary" />
		</FormButton>
	</div>
</template>
<script setup lang="ts">
import { PaperClipIcon } from '@heroicons/vue/20/solid'
import { useQuery } from '@vue/apollo-composable'
import { blobInfoQuery } from '~~/lib/projects/graphql/queries'
import { useFileDownload } from '~~/lib/core/composables/fileUpload'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'

const { download } = useFileDownload()
const { triggerNotification } = useGlobalToast()

const props = defineProps<{
	blobId: string
	projectId: string
}>()

const { result } = useQuery(blobInfoQuery, () => ({
	streamId: props.projectId,
	blobId: props.blobId
}))

const fileInfo = computed(() => {
	return {
		name: result.value?.stream?.blob?.fileName,
		type: result.value?.stream?.blob?.fileType,
		size: result.value?.stream?.blob?.fileSize
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
