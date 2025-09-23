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
        :disabled="!selectedFile"
      ></FormTextInput>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { AccHub, AccItem } from '@speckle/shared/acc'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useAccAuthManager } from '~/lib/acc/composables/useAccAuthManager'
import { useAcc, type AccFolder } from '~/lib/acc/composables/useAccFiles'
import { accSyncItemCreateMutation } from '~/lib/acc/graphql/mutations'
import { useCreateNewModel } from '~/lib/projects/composables/modelManagement'

type FormValues = { feedback: string }

const props = defineProps<{
  title?: string
  intro?: string
  hideSuppport?: boolean
  projectId?: string
  metadata?: Record<string, unknown>
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { handleSubmit } = useForm<FormValues>()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Create',
    props: { color: 'primary' },
    onClick: () => {
      onSubmit()
    },
    id: 'createAccSync'
  }
])

const { triggerNotification } = useGlobalToast()
const createModel = useCreateNewModel()

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
const selectedFile = ref<AccItem | undefined>()

const {
  hubs,
  fetchHubs,
  loadingHubs,
  projects,
  fetchProjects,
  loadingProjects,
  folderTree,
  fetchItemsForFolder,
  rootProjectFolderId,
  init
} = useAcc()

const { tokens, tryGetTokensFromCookies } = useAccAuthManager()

const onHubClick = async (hub: AccHub) => {
  selectedHub.value = hub
  selectedHubId.value = hub.id
  await fetchProjects(hub.id, tokens.value!.access_token)
}

// Refactored onProjectClick to use the composable's init function
const onProjectClick = async (hubId: string, projectId: string) => {
  selectedFolder.value = undefined
  selectedFile.value = undefined
  selectedProjectId.value = projectId
  await init(hubId, projectId, tokens.value!.access_token)

  // defaulting to first
  if (folderTree.value && folderTree.value.children) {
    selectedFolder.value = folderTree.value?.children[0]
    await fetchItemsForFolder(
      selectedFolder.value.id,
      selectedProjectId.value,
      tokens.value!.access_token
    )
  }
}

const onFileSelected = (item: AccItem) => {
  selectedFile.value = item
}

const { mutate: createAccSyncItem } = useMutation(accSyncItemCreateMutation)

const addSync = async () => {
  try {
    // annoying but looks like ACC does not give the exact version number directly
    const fileVersion = Number(
      new URLSearchParams(selectedFile.value?.latestVersionId?.split('?')[1]).get(
        'version'
      )
    )

    const accFileViewName = revitViewName.value === '' ? undefined : revitViewName.value

    const res = await createModel({
      name: (selectedFile.value?.attributes.displayName ||
        selectedFile.value?.attributes.name) as string,
      description: '',
      projectId: props.projectId as string
    })

    await createAccSyncItem({
      input: {
        projectId: props.projectId as string,
        modelId: res?.id as string,
        accRegion: selectedHub.value?.attributes?.region as string,
        accFileExtension: selectedFile.value?.fileExtension as string,
        accHubId: selectedHubId.value!,
        accProjectId: selectedProjectId.value as string,
        accRootProjectFolderUrn: rootProjectFolderId.value!,
        accFileLineageUrn: selectedFile.value?.id as string,
        accFileName: (selectedFile.value?.attributes.displayName ||
          selectedFile.value?.attributes.name) as string,
        accFileVersionIndex: fileVersion,
        accFileVersionUrn: selectedFile.value?.latestVersionId as string,
        accFileViewName
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Add sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  } finally {
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
    selectedFile.value = undefined
  }
})
</script>
