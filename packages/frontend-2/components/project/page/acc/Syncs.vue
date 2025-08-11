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
        <ProjectPageAccSyncStatus :status="item.status" />
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
          :to="`/projects/${projectId}/models/${item.modelId}`"
        >
          {{ item.modelId }}
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
            :icon-left="item.status === 'paused' ? Play : Pause"
            @click="handleStatusSyncItem(item.id, item.status === 'paused')"
          />
          <FormButton
            hide-text
            color="outline"
            :icon-left="Trash2"
            @click="handleDeleteSyncItem(item.id)"
          />
        </div>
      </template>
    </LayoutTable>
    <FormButton
      color="outline"
      size="sm"
      :disabled="!isLoggedIn"
      :disabled-tooltip="'Log in required'"
      @click="showNewSyncDialog = true"
    >
      <template #default>
        <div v-tippy="isLoggedIn ? undefined : 'Log in required'">New sync</div>
      </template>
    </FormButton>
    <LayoutDialog v-model:open="showNewSyncDialog" title="Create new sync">
      <div class="flex flex-col">
        <div v-if="step === 0" class="space-y-2">
          <ProjectPageAccHubs
            :hubs="hubs"
            :loading="loadingHubs"
            @hub-selected="onHubClick"
          />

          <ProjectPageAccProjects
            v-if="selectedHubId"
            :hub-id="selectedHubId"
            :projects="projects"
            :loading="loadingProjects"
            @project-selected="onProjectClick"
          />

          <ProjectPageAccFiles
            v-if="selectedProjectId"
            :folder-contents="folderContents"
            :sync-items="accSyncItems || []"
            :selected-folder-content="selectedFolderContent"
            :loading="loadingFiles"
            @select="onFileSelected"
          />

          <FormTextInput
            v-model="revitViewName"
            name="revitFileViewName"
            color="foundation"
            label="Revit view name (Optional)"
            show-label
            :disabled="!selectedFolderContent"
          ></FormTextInput>

          <div class="flex flex-row justify-center mt-4 space-x-2">
            <FormButton size="sm" color="outline" @click="showNewSyncDialog = false">
              Cancel
            </FormButton>
            <FormButton size="sm" :disabled="!selectedFolderContent" @click="step++">
              Next
            </FormButton>
          </div>
        </div>
        <div v-if="step === 1" class="flex flex-col justify-between space-y-2">
          <div>
            Selected ACC file:
            {{
              selectedFolderContent?.attributes.name ||
              selectedFolderContent?.attributes.displayName
            }}
          </div>
          <FormSelectBase
            v-model="selectedModel"
            :label="'Models'"
            :name="'accModelSelector'"
            show-label
            :items="models"
            :disabled-item-predicate="disabledItemPredicate"
            mount-menu-on-body
          >
            <template #something-selected="{ value }">
              {{ isArray(value) ? value[0].name : value.name }}
            </template>
            <template #option="{ item }">
              {{ item.name }}
            </template>
          </FormSelectBase>
          <div class="flex flex-row justify-center mt-4 space-x-2">
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
import type { AccTokens, AccHub, AccProject, AccItem } from '@speckle/shared/acc'
import { ref, computed } from 'vue'
import type {
  ProjectLatestModelsPaginationQueryVariables,
  ProjectPageLatestItemsModelItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable'
import { latestModelsQuery } from '~/lib/projects/graphql/queries'
import { isArray } from 'lodash-es'
import {
  accSyncItemCreateMutation,
  accSyncItemDeleteMutation,
  accSyncItemUpdateMutation
} from '~/lib/acc/graphql/mutations'
import { projectAccSyncItemsQuery } from '~/lib/acc/graphql/queries'
import { onProjectAccSyncItemUpdatedSubscription } from '~/lib/acc/graphql/subscriptions'
import { Pause, Play, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  tokens: AccTokens | undefined
  isLoggedIn: boolean
}>()

const step = ref(0)

const showNewSyncDialog = ref(false)
const { triggerNotification } = useGlobalToast()

const tokens = computed(() => props.tokens)
const hubs = ref<AccHub[]>([])
const loadingHubs = ref(false)
const selectedHub = ref<AccHub | null>(null)
const selectedHubId = ref<string | null>(null)
const rootProjectFolderId = ref<string | null>(null)
const projects = ref<AccProject[]>([])
const loadingProjects = ref(false)
const selectedProjectId = ref<string | null>(null)
const folderContents = ref<AccItem[]>([])
const selectedFolderContent = ref<AccItem>()
const loadingFiles = ref(false)

const revitViewName = ref<string>()

const searchText = ref<string>()

const selectedModel = ref<ProjectPageLatestItemsModelItemFragment>()

const latestModelsQueryVariables = computed(
  (): ProjectLatestModelsPaginationQueryVariables => {
    const shouldHaveFilter = searchText.value && searchText.value.length > 0
    return {
      projectId: props.projectId,
      filter: shouldHaveFilter
        ? {
            search: searchText.value || null
          }
        : null
    }
  }
)

const { result: modelsResult } = useQuery(
  latestModelsQuery,
  () => latestModelsQueryVariables.value
)

const models = computed(() => modelsResult.value?.project?.models?.items || [])

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

const disabledItemPredicate = (item: ProjectPageLatestItemsModelItemFragment) => {
  return !!accSyncItems.value.find((i) => i.modelId === item.id)
}

onProjectAccSyncItemsUpdated((res) => {
  // TODO ACC: Mutate local cache instead of refetch

  refetchAccSyncItems()
  triggerNotification({
    type: ToastNotificationType.Info,
    title: `ACC sync model ${res.data?.projectAccSyncItemsUpdated.type.toLowerCase()}`,
    description: res.data?.projectAccSyncItemsUpdated.accSyncItem?.accFileName
  })
})

const fetchHubs = async () => {
  loadingHubs.value = true
  try {
    const res = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
      headers: { Authorization: `Bearer ${tokens.value!.access_token}` }
    })

    if (!res.ok) throw new Error('Failed to fetch hubs')
    hubs.value = (await res.json()).data
    // console.log('Hubs', hubs.value)
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to fetch hubs',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  } finally {
    loadingHubs.value = false
  }
}

const onHubClick = async (hub: AccHub) => {
  selectedHub.value = hub
  selectedHubId.value = hub.id
  await fetchProjects(hub.id)
}

const fetchProjects = async (hubId: string) => {
  loadingProjects.value = true
  try {
    const res = await fetch(
      `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`,
      { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
    )
    if (!res.ok) throw new Error('Failed to fetch projects')
    projects.value = (await res.json()).data
    // console.log('Projects', projects.value)
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error fetching projects',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  } finally {
    loadingProjects.value = false
  }
}

const onProjectClick = async (hubId: string, projectId: string) => {
  selectedProjectId.value = projectId
  loadingFiles.value = true
  folderContents.value = []
  const rootFolderId = await getProjectRootFolderId(hubId, projectId)
  if (rootFolderId) {
    const collectedFiles = await fetchFolderContents(projectId, rootFolderId, [])
    folderContents.value = collectedFiles
    // console.log('collectedFiles under root folder',collectedFiles)
  }
  loadingFiles.value = false
}

const getProjectRootFolderId = async (hubId: string, projectId: string) => {
  try {
    const res = await fetch(
      `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}`,
      { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
    )
    if (!res.ok) throw (new Error('Failed to get project details'), null)
    const r = await res.json()
    // console.log('root folder id', r)
    rootProjectFolderId.value = r.data.relationships?.rootFolder?.data?.id || null
    return rootProjectFolderId.value
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error getting project root folder ID',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

const fetchFolderContents = async (
  projectId: string,
  folderId: string,
  collectedItems: AccItem[] = []
) => {
  try {
    const res = await fetch(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`,
      { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
    )
    if (!res.ok) {
      throw new Error(`Failed to fetch contents of folder ${folderId}`)
    }

    const data = (await res.json()).data
    const folderPromises: Promise<AccItem[]>[] = []
    const itemPromises: Promise<void>[] = []

    for (const item of data) {
      if (item.type === 'folders') {
        folderPromises.push(fetchFolderContents(projectId, item.id, collectedItems))
      } else if (item.type === 'items') {
        itemPromises.push(
          (async () => {
            const version = await fetchItemLatestVersion(projectId, item.id)
            if (version) {
              const storageUrn = version.relationships?.storage?.data?.id || null
              collectedItems.push({
                ...item,
                latestVersionId: version.id,
                fileExtension: version.attributes.fileType,
                storageUrn
              })
            } else {
              collectedItems.push(item)
            }
          })()
        )
      }
    }

    await Promise.all([...folderPromises, ...itemPromises])
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: `Error fetching folder contents for ${folderId}:`,
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
  return collectedItems
}

const fetchItemLatestVersion = async (projectId: string, itemId: string) => {
  try {
    const res = await fetch(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${encodeURIComponent(
        itemId
      )}/versions`,
      { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
    )
    if (!res.ok) {
      throw new Error(`Failed to fetch versions for item ${itemId}`)
    }
    const versions = (await res.json()).data
    // console.log('versions', versions)
    if (versions.length > 0) return versions[0]
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: `Error fetching versions for item ${itemId}:`,
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
  return null
}

const onFileSelected = (item: AccItem) => {
  selectedFolderContent.value = item
}

const { mutate: createAccSyncItem } = useMutation(accSyncItemCreateMutation)

const addSync = async () => {
  try {
    // annoying but looks like ACC does not give the exact version number directly
    const fileVersion = Number(
      new URLSearchParams(
        selectedFolderContent.value?.latestVersionId?.split('?')[1]
      ).get('version')
    )

    const accFileViewName = revitViewName.value === '' ? undefined : revitViewName.value

    await createAccSyncItem({
      input: {
        projectId: props.projectId,
        modelId: selectedModel.value?.id as string,
        accRegion: selectedHub.value?.attributes?.region as string,
        accFileExtension: selectedFolderContent.value?.fileExtension as string,
        accHubId: selectedHubId.value!,
        accProjectId: selectedProjectId.value as string,
        accRootProjectFolderUrn: rootProjectFolderId.value!,
        accFileLineageUrn: selectedFolderContent.value?.id as string,
        accFileName: (selectedFolderContent.value?.attributes.displayName ||
          selectedFolderContent.value?.attributes.name) as string,
        accFileVersionIndex: fileVersion,
        accFileVersionUrn: selectedFolderContent.value?.latestVersionId as string,
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
    selectedFolderContent.value = undefined
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
    fetchHubs()
  }
})
</script>
