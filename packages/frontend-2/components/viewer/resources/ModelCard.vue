<template>
  <div
    v-if="model"
    class="px-1 pt-2 flex flex-col items-center bg-foundation shadow-md rounded-md"
  >
    <div class="w-full flex items-center justify-between mb-2">
      <div class="px-1 flex">
        <span class="font-bold text-lg">{{ model?.name }}</span>
        &nbsp;
      </div>
      <div class="flex space-x-2">
        <span class="text-xs text-foreground-2">last update {{ updatedAt }}</span>
        <XMarkIcon class="text-foreground-2 w-3 h-4 mr-1" />
      </div>
    </div>
    <div class="w-full">
      <ViewerResourcesVersionCardDesignOption2
        :version="(loadedVersion as ModelCardVersionFragment)"
        :show-metadata="false"
        :clickable="false"
      />
    </div>
    <div class="flex flex-col bg-teal-300/0 w-full">
      <button
        v-if="versions.length !== 1"
        class="w-full flex justify-between hover:bg-foundation-focus py-2 px-1 rounded-md transition"
        @click="showVersions = !showVersions"
      >
        <div class="flex space-x-1 text-xs font-bold text-foreground-2">
          <span>Versions</span>
          <ArrowPathRoundedSquareIcon class="w-3 h-4 mr-1" />
          <span>{{ model?.versions?.totalCount }}</span>
        </div>
        <div><ChevronDownIcon class="w-3 h-3" /></div>
      </button>
      <div v-else class="py-2 px-1 text-xs font-bold text-foreground-2">
        No other versions
      </div>
      <div v-if="showVersions" class="flex flex-col space-y-1">
        <ViewerResourcesVersionCardDesignOption2
          v-for="version in versions"
          :key="version.id"
          :version="version"
          @change-version="handleVersionChange"
        />
        <span class="text-xs text-center py-2 text-foreground-2">
          TODO: Version Pagination
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { modelCardQuery } from '~~/lib/projects/graphql/queries'
import { useGetObjectUrl } from '~~/lib/viewer/helpers'
import { ViewerModelResource } from '~~/lib/viewer/services/route'
import {
  ChevronDownIcon,
  ArrowPathRoundedSquareIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'
import { ModelCardVersionFragment } from '~~/lib/common/generated/gql/graphql'
import {
  useInjectedViewer,
  useViewerRouteResources
} from '~~/lib/viewer/composables/viewer'
import { ComputedRef } from 'vue'

const { viewer, isInitializedPromise } = useInjectedViewer()

const props = defineProps<{
  model: ViewerModelResource
  projectId?: string
}>()

const route = useRoute()
const getObjectUrl = useGetObjectUrl()
const { switchModelToVersion } = useViewerRouteResources()

const projectId = computed(() => {
  return props.projectId || (route.params.id as string)
})

provide('projectId', projectId.value)

const showVersions = ref(false)

graphql(`
  fragment ModelCardModel on Model {
    id
    name
    updatedAt
    versions {
      totalCount
      items {
        ...ModelCardVersion
      }
    }
  }

  fragment ModelCardVersion on Version {
    id
    message
    referencedObject
    sourceApplication
    authorId
    authorName
    authorAvatar
    createdAt
  }
`)

const { result } = useQuery(modelCardQuery, () => ({
  projectId: projectId.value,
  modelId: props.model.modelId
}))

const model = computed(() => {
  return result?.value?.project?.model
})

const versions = computed(() => {
  return result.value?.project?.model?.versions?.items || []
})

const loadedVersion = computed(() => {
  if (props.model.versionId) {
    return versions.value.find(
      (v) => v.id === props.model.versionId
    ) as ModelCardVersionFragment
  } else {
    return versions.value[0] as ModelCardVersionFragment
  }
})

const latestVersion = computed(() => {
  return versions.value[0]
})

provide('loadedVersion', loadedVersion as ComputedRef<ModelCardVersionFragment>)
provide('latestVersion', latestVersion as ComputedRef<ModelCardVersionFragment>)

const updatedAt = computed(() =>
  model.value ? dayjs(model.value?.updatedAt).from(dayjs()) : null
)

const unwatch = watch(loadedVersion, async (newVal) => {
  if (!newVal) return
  await isInitializedPromise
  const url = getObjectUrl(projectId.value as string, newVal.referencedObject)
  viewer.loadObject(url)
  unwatch() // important to stop watching as the loaded version is reactive. we want this to fire on "mounted" only (not using on mounted as it's null in there)
})

async function handleVersionChange(versionId: string) {
  await swapVersion(versionId)
}

async function swapVersion(newVersionId: string) {
  if (newVersionId === loadedVersion.value?.id) return

  const oldObjectUrl = getObjectUrl(
    projectId.value as string,
    loadedVersion.value.referencedObject
  )
  const newVersion = versions.value.find((v) => v.id === newVersionId)
  const newObjectUrl = getObjectUrl(
    projectId.value as string,
    newVersion?.referencedObject as string
  )

  // TODO: Do from 'setupViewer'
  await Promise.all([
    viewer.unloadObject(oldObjectUrl),
    viewer.loadObject(newObjectUrl)
  ])
  switchModelToVersion(props.model.modelId, newVersionId)
}
</script>
