<template>
  <div class="flex flex-col space-y-2">
    <div class="flex text-body-xs text-foreground font-medium">Sync items</div>
    <LayoutTable
      class="bg-foundation"
      :columns="[
        { id: 'status', header: 'Status', classes: 'col-span-2' },
        { id: 'accFileName', header: 'File name', classes: 'col-span-3' },
        { id: 'modelName', header: 'Model name', classes: 'col-span-3' },
        { id: 'createdBy', header: 'Created by', classes: 'col-span-3' }
      ]"
      :items="syncs"
    >
      <template #status="{ item }">
        <ProjectPageAccSyncStatus :status="item.status" />
      </template>
      <template #accFileName="{ item }">
        {{ item.accFileLineageId }}
      </template>
      <template #modelName="{ item }">
        {{ item.modelId }}
      </template>
      <template #createdBy="{ item }">
        {{ item.author?.name }}
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
      <div class="flex flex-col space-y-2">
        <div v-if="step === 0">
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
            :selected-folder-content="selectedFolderContent"
            :loading="loadingFiles"
            @download="onDownloadClick"
            @select="onFileSelected"
          />

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
import type { AccTokens, AccHub, AccProject, AccItem } from '~/lib/acc/types'
import { ref, computed } from 'vue'
import type {
  ProjectAccSyncItemFragment,
  ProjectLatestModelsPaginationQueryVariables,
  ProjectPageLatestItemsModelItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { latestModelsQuery } from '~/lib/projects/graphql/queries'
import { isArray } from 'lodash-es'

const props = defineProps<{
  projectId: string
  tokens: AccTokens | undefined
  syncs: ProjectAccSyncItemFragment[]
  isLoggedIn: boolean
}>()

// const internalSyncs = computed(() => props.syncs)

const step = ref(0)

const showNewSyncDialog = ref(false)
const { triggerNotification } = useGlobalToast()

const tokens = computed(() => props.tokens)
const hubs = ref<AccHub[]>([])
const loadingHubs = ref(false)
const selectedHub = ref<AccHub | null>(null)
const selectedHubId = ref<string | null>(null)
const folderUrn = ref<string | null>(null)
const projects = ref<AccProject[]>([])
const loadingProjects = ref(false)
const selectedProjectId = ref<string | null>(null)
const folderContents = ref<AccItem[]>([])
const selectedFolderContent = ref<AccItem>()
const loadingFiles = ref(false)

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
    folderUrn.value = r.data.relationships?.rootFolder?.data?.id || null
    return folderUrn.value
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

const getSignedDownloadUrl = async (projectId: string, versionId: string) => {
  const res = await fetch(
    `https://developer.api.autodesk.com/data/v1/projects/${projectId}/versions/${encodeURIComponent(
      versionId
    )}/download`,
    { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
  )
  if (!res.ok) throw new Error(`Failed to generate ACC download URL`)
  const { links } = await res.json()
  return links.self.href
}

const onDownloadClick = async (item: AccItem) => {
  try {
    const signedUrl = await getSignedDownloadUrl(
      selectedProjectId.value as string,
      item.latestVersionId as string
    )
    window.open(signedUrl, '_blank')
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Download failed',
      description: e instanceof Error ? e.message : 'Unexpected error'
    })
  }
}

const onFileSelected = (item: AccItem) => {
  selectedFolderContent.value = item
}

// const handleModelSelect = (model: ProjectPageLatestItemsModelItemFragment) => {
//   selectedModel.value = model
// }

const addSync = async () => {
  // const item = {
  //   id: 'whatever',
  //   accHub: selectedHub.value,
  //   accHubId: selectedHubId.value,
  //   accHubUrn: folderUrn.value,
  //   modelId: selectedModel.value?.id,
  //   projectId: props.projectId,
  //   projectName: '',
  //   modelName: selectedModel.value?.displayName,
  //   createdBy: 'cat',
  //   accItem: selectedFolderContent.value,
  //   status: 'syncing'
  // } as AccSyncItem
  // internalSyncs.value.push(item)
  // await fetch('/acc/sync-item-created', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(item)
  // })

  // TODO: mutation
  showNewSyncDialog.value = false
  step.value = 0
}

watch(tokens, (newTokens) => {
  if (newTokens?.access_token) {
    fetchHubs()
  }
})
</script>
