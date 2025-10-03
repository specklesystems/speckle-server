<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="dialogTitle"
    :buttons="dialogButtons"
    max-width="lg"
    fullscreen="none"
  >
    <div class="flex flex-col space-y-2">
      <IntegrationsAccHubs
        :hubs="hubs"
        :loading="loadingHubs"
        @hub-selected="onHubClick"
      />

      <IntegrationsAccProjects
        v-if="selectedHubId"
        :hub-id="selectedHubId"
        :projects="projects"
        :loading="loadingProjects"
        @project-selected="onProjectClick"
      />

      <IntegrationsAccFileSelector
        v-if="selectedProjectId && selectedHubId && tokens"
        :key="selectedProjectId"
        :hub-id="selectedHubId"
        :project-id="selectedProjectId"
        :tokens="tokens"
        @file-selected="onFileSelected"
      />

      <FormTextInput
        v-model="revitViewName"
        name="revitFileViewName"
        color="foundation"
        label="Revit view name (Optional)"
        show-label
        :disabled="!selectedFileVersion"
      ></FormTextInput>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { AccHub } from '@speckle/shared/acc'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { useAccAuthManager } from '~/lib/acc/composables/useAccAuthManager'
import {
  useAcc,
  type AccFolder,
  type AccItemVersion
} from '~/lib/acc/composables/useAccFiles'
import { useCreateAccSyncItem } from '~/lib/acc/composables/useCreateAccSyncItem'

type FormValues = { feedback: string }

const props = defineProps<{
  title?: string
  intro?: string
  hideSuppport?: boolean
  projectId?: string
  metadata?: Record<string, unknown>
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const isCreatingSyncItem = ref(false)
const disableCreateButton = computed(() => !!isCreatingSyncItem.value)

const { handleSubmit } = useForm<FormValues>()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Create',
    props: { color: 'primary', loading: isCreatingSyncItem.value },
    onClick: () => {
      onSubmit()
    },
    disabled: disableCreateButton.value,
    disabledMessage: 'Creating ACC sync...',
    id: 'createAccSync'
  }
])

const { triggerNotification } = useGlobalToast()
const createAccSyncItem = useCreateAccSyncItem()

const dialogTitle = computed(() => props.title || 'Create sync from ACC')

const onSubmit = handleSubmit(async () => {
  await addSync()
  isOpen.value = false
})

const selectedHub = ref<AccHub | null>(null)
const selectedHubId = ref<string | null>(null)
const selectedProjectId = ref<string | null>(null)

const revitViewName = ref<string>()

const selectedFolder = ref<AccFolder | undefined>()
const selectedFileId = ref<string | undefined>()
const selectedFileVersion = ref<AccItemVersion | undefined>()

const {
  hubs,
  fetchHubs,
  loadingHubs,
  projects,
  fetchProjects,
  loadingProjects,
  rootProjectFolderId,
  init
} = useAcc()

const { tokens, tryGetTokensFromCookies } = useAccAuthManager()

const onHubClick = async (hub: AccHub) => {
  selectedHub.value = hub
  selectedHubId.value = hub.id
  await fetchProjects(hub.id, tokens.value!.access_token)
}

const onProjectClick = async (hubId: string, projectId: string) => {
  selectedFolder.value = undefined
  selectedFileVersion.value = undefined
  selectedProjectId.value = projectId
  await init(hubId, projectId, tokens.value!.access_token)
}

const onFileSelected = (fileId: string, fileVersion: AccItemVersion) => {
  selectedFileId.value = fileId
  selectedFileVersion.value = fileVersion
}

const addSync = async () => {
  try {
    if (!selectedFileVersion.value || !selectedFileVersion.value.fileType) {
      return
    }
    isCreatingSyncItem.value = true

    const fileVersion = selectedFileVersion.value.versionNumber
    const accFileViewName = revitViewName.value === '' ? undefined : revitViewName.value

    await createAccSyncItem({
      projectId: props.projectId as string,
      accRegion: selectedHub.value?.attributes?.region as string,
      accFileExtension: selectedFileVersion.value.fileType,
      accHubId: selectedHubId.value!,
      accProjectId: selectedProjectId.value as string,
      accRootProjectFolderUrn: rootProjectFolderId.value!,
      accFileLineageUrn: selectedFileId.value as string,
      accFileName: selectedFileVersion.value.name,
      accFileVersionIndex: fileVersion,
      accFileVersionUrn: selectedFileVersion.value.id,
      accFileViewName
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Add sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  } finally {
    isCreatingSyncItem.value = false
    revitViewName.value = undefined
  }
}

watch(tokens, (newTokens) => {
  if (newTokens?.access_token) {
    fetchHubs(newTokens?.access_token)
  }
})

onMounted(async () => {
  await tryGetTokensFromCookies()
  if (tokens.value) {
    fetchHubs(tokens.value.access_token)
  }
})

watch(isOpen, (newVal) => {
  if (newVal) {
    selectedFileVersion.value = undefined
  }
})
</script>
