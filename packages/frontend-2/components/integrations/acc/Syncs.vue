<template>
  <div class="flex flex-col space-y-2">
    <div class="flex text-body-xs text-foreground font-medium">Sync models</div>
    <LayoutTable
      class="bg-foundation"
      :columns="[
        { id: 'status', header: 'Status', classes: 'col-span-2' },
        { id: 'accFileName', header: 'File name', classes: 'col-span-2' },
        { id: 'accFileViewName', header: 'View name', classes: 'col-span-2' },
        { id: 'modelId', header: 'Model id', classes: 'col-span-2' },
        { id: 'createdBy', header: 'Created by', classes: 'col-span-2' },
        { id: 'actions', header: 'Actions', classes: 'col-span-2' }
      ]"
      :items="accSyncItems"
    >
      <template #status="{ item }">
        <IntegrationsAccSyncStatus :status="item.status" />
      </template>
      <template #accFileName="{ item }">
        {{ item.accFileName }}
      </template>
      <template #accFileViewName="{ item }">
        {{ item.accFileViewName || '-' }}
      </template>
      <template #modelId="{ item }">
        <NuxtLink
          class="text-foreground-1 hover:text-blue-500 underline"
          :to="`/projects/${projectId}/models/${item.model?.id}`"
        >
          {{ item.model?.id }}
        </NuxtLink>
      </template>
      <template #createdBy="{ item }">
        {{ item.author?.name }}
      </template>
      <template #actions="{ item }">
        <div class="space-x-2">
          <FormButton
            hide-text
            color="outline"
            :icon-left="item.status === 'paused' ? PlayIcon : PauseIcon"
            @click="handleStatusSyncItem(item.id, item.status === 'paused')"
          />
          <FormButton
            hide-text
            color="outline"
            :icon-left="TrashIcon"
            @click="handleDeleteSyncItem(item.id)"
          />
        </div>
      </template>
    </LayoutTable>
    <!-- <FormButton
      color="outline"
      size="sm"
      :disabled="!isLoggedIn"
      :disabled-tooltip="'Log in required'"
      @click="showNewSyncDialog = true"
    >
      <template #default>
        <div v-tippy="isLoggedIn ? undefined : 'Log in required'">New sync</div>
      </template>
    </FormButton> -->
    <LayoutDialog
      v-model:open="showNewSyncDialog"
      title="Create new sync"
      @fully-closed="step = 0"
    >
      <div class="flex flex-col">
        <div v-if="step === 0" class="space-y-2">
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

          <div class="flex flex-row justify-center mt-4 space-x-2">
            <FormButton size="sm" color="outline" @click="showNewSyncDialog = false">
              Cancel
            </FormButton>
            <FormButton size="sm" :disabled="!selectedFile" @click="step++">
              Next
            </FormButton>
          </div>
        </div>
        <div v-if="step === 1" class="flex flex-col space-y-2">
          <CommonAlert color="info" hide-icon>
            <template #title>
              Selected ACC file:
              {{
                selectedFile?.attributes.name || selectedFile?.attributes.displayName
              }}
            </template>
          </CommonAlert>
          <hr />
          <IntegrationsAccModelSelector
            :project-id="projectId"
            :acc-sync-items="accSyncItems"
            @model-selected="(model) => (selectedModel = model)"
          />
          <hr />
          <div class="flex flex-row justify-center space-x-2">
            <FormButton size="sm" color="outline" @click="showNewSyncDialog = false">
              Cancel
            </FormButton>
            <FormButton size="sm" :disabled="!selectedModel" @click="addSync">
              Add
            </FormButton>
          </div>
        </div>
      </div>
    </LayoutDialog>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens, AccHub, AccItem } from '@speckle/shared/acc'
import { ref, computed, watch } from 'vue'
import type { ProjectPageLatestItemsModelItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable'
import {
  accSyncItemCreateMutation,
  accSyncItemDeleteMutation,
  accSyncItemUpdateMutation
} from '~/lib/acc/graphql/mutations'
import { projectAccSyncItemsQuery } from '~/lib/acc/graphql/queries'
import { onProjectAccSyncItemUpdatedSubscription } from '~/lib/acc/graphql/subscriptions'
import { PauseIcon } from '@heroicons/vue/24/solid'
import { TrashIcon, PlayIcon } from '@heroicons/vue/24/outline'

import type { AccFolder } from '~/lib/acc/composables/useAccFiles'
import { useAcc } from '~/lib/acc/composables/useAccFiles'

const props = defineProps<{
  projectId: string
  tokens: AccTokens | undefined
  isLoggedIn: boolean
}>()

const step = ref(0)
const showNewSyncDialog = ref(false)
const { triggerNotification } = useGlobalToast()

const tokens = computed(() => props.tokens)

const selectedHub = ref<AccHub | null>(null)
const selectedHubId = ref<string | null>(null)
const selectedProjectId = ref<string | null>(null)

const revitViewName = ref<string>()
const selectedModel = ref<ProjectPageLatestItemsModelItemFragment>()

const selectedFolder = ref<AccFolder | undefined>()
const selectedFile = ref<AccItem | undefined>()

// Use the composable to get the state and functions
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

const onFileSelected = (item: AccItem) => {
  selectedFile.value = item
}

const { result: accSyncItemsResult, refetch: refetchAccSyncItems } = useQuery(
  projectAccSyncItemsQuery,
  () => ({
    id: props.projectId
  })
)

const accSyncItems = computed(
  () => accSyncItemsResult.value?.project.accSyncItems.items || []
)

const { onResult: onProjectAccSyncItemsUpdated } = useSubscription(
  onProjectAccSyncItemUpdatedSubscription,
  () => ({
    id: props.projectId
  })
)

onProjectAccSyncItemsUpdated((res) => {
  // TODO ACC: Mutate local cache instead of refetch

  refetchAccSyncItems()
  triggerNotification({
    type: ToastNotificationType.Info,
    title: `ACC sync model ${res.data?.projectAccSyncItemsUpdated.type.toLowerCase()}`,
    description: res.data?.projectAccSyncItemsUpdated.accSyncItem?.accFileName
  })
})

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

    await createAccSyncItem({
      input: {
        projectId: props.projectId,
        modelId: selectedModel.value?.id as string,
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
    showNewSyncDialog.value = false
    step.value = 0
  }
}

const { mutate: deleteAccSyncItem } = useMutation(accSyncItemDeleteMutation)

const handleDeleteSyncItem = async (id: string) => {
  try {
    await deleteAccSyncItem({
      input: {
        projectId: props.projectId,
        id
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Delete sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

const { mutate: updateAccSyncItem } = useMutation(accSyncItemUpdateMutation)

const handleStatusSyncItem = async (id: string, isPaused: boolean) => {
  try {
    await updateAccSyncItem({
      input: {
        projectId: props.projectId,
        id,
        status: isPaused ? 'pending' : 'paused'
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Update sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

watch(tokens, (newTokens) => {
  if (newTokens?.access_token) {
    fetchHubs(newTokens?.access_token)
  }
})
</script>
