<template>
  <div v-if="model">
    <ViewerResourcesLoadedVersionCard
      v-if="!showVersions"
      :version="loadedVersion"
      :model="model"
      @show-versions="showVersions = true"
      @load-latest="loadLatestVersion"
    />
    <div v-if="showVersions" class="pb-2 bg-foundation rounded-md shadow">
      <div class="px-2 py-4 flex items-center truncate space-x-2">
        <FormButton
          :icon-left="ChevronLeftIcon"
          text
          size="xs"
          @click="showVersions = false"
        >
          Back
        </FormButton>
        <span>
          <b>{{ model.name }}</b>
          versions
        </span>
      </div>
      <div class="space-y-0">
        <ViewerResourcesVersionCardDesignOption3
          v-for="version in versions"
          :key="version.id"
          :version="version"
          class="bg-foundation"
          @change-version="handleVersionChange"
        />
      </div>
      <div class="mt-4 text-xs text-center py-2 text-foreground-2">
        TODO: Version Pagination
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { modelCardQuery } from '~~/lib/projects/graphql/queries'
import {
  ViewerModelResource,
  getObjectUrl,
  ViewerResource
} from '~~/lib/viewer/helpers'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { ModelCardVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
import { ComputedRef } from 'vue'
import { Ref } from 'vue'

const { viewer, isInitializedPromise } = useInjectedViewer()

const props = defineProps<{
  model: ViewerModelResource
  projectId?: string
}>()

const route = useRoute()

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

const { updateResourceVersion } = inject('resources') as {
  resources: Ref<ViewerResource[]>
  updateResourceVersion: (resourceId: string, resourceVersion: string) => void
}

async function handleVersionChange(versionId: string) {
  await swapVersion(versionId)
  // showVersions.value = false
}

async function loadLatestVersion() {
  await swapVersion(latestVersion.value.id)
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

  await Promise.all([
    viewer.unloadObject(oldObjectUrl),
    viewer.loadObject(newObjectUrl)
  ])
  updateResourceVersion(props.model.modelId, newVersionId)
}
</script>
