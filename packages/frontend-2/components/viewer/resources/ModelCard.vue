<template>
  <div>
    <div v-if="model">
      <div>
        <ViewerResourcesLoadedVersionCardVersion2
          v-if="loadedVersion"
          :version="loadedVersion"
          :model="model"
          :is-latest-version="loadedVersion?.id === latestVersionId"
          @show-versions="showVersions = !showVersions"
          @load-latest="loadLatestVersion"
        />
      </div>
    </div>
    <div
      v-if="showVersions"
      class="mr-0 -mt-4 pt-8 bg-foundation flex flex-col rounded-md max-h-96 overflow-y-auto simple-scrollbar"
    >
      <div>
        <ViewerResourcesVersionCard
          v-if="loadedVersion"
          :model-id="modelId"
          :version="loadedVersion"
          :is-latest-version="loadedVersion.id === latestVersionId"
          :is-loaded-version="loadedVersion.id === loadedVersion?.id"
          :show-timeline="false"
          @change-version="handleVersionChange"
        />
        <hr class="dark:border-gray-700 my-2" />
        <ViewerResourcesVersionCard
          v-for="version in props.model.versions.items"
          :key="version.id"
          :model-id="modelId"
          :version="version"
          :is-latest-version="version.id === latestVersionId"
          :is-loaded-version="version.id === loadedVersion?.id"
          @change-version="handleVersionChange"
        />
      </div>
      <div class="mt-4 px-2 py-2">
        <FormButton
          full-width
          text
          size="sm"
          :disabled="!showLoadMore"
          @click="onLoadMore"
        >
          {{ showLoadMore ? 'View older versions' : 'No more versions' }}
        </FormButton>
      </div>
      <!-- <div v-else class="py-2" /> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import { Get } from 'type-fest'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const emit = defineEmits<{
  (e: 'loaded-more'): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
}>()

const { switchModelToVersion } = useInjectedViewerRequestedResources()
const { loadMoreVersions } = useInjectedViewerLoadedResources()

const showVersions = ref(false)

graphql(`
  fragment ViewerModelVersionCardItem on Version {
    id
    message
    referencedObject
    sourceApplication
    createdAt
    previewUrl
    authorUser {
      ...LimitedUserAvatar
    }
  }
`)

const modelId = computed(() => props.model.id)
const versions = computed(() => [
  ...props.model.loadedVersion.items,
  ...props.model.versions.items
])
const showLoadMore = computed(() => {
  const totalCount = props.model.versions.totalCount
  const currentCount = versions.value.length
  return currentCount < totalCount
})

const loadedVersion = computed(() =>
  versions.value.find((v) => v.id === props.versionId)
)

const latestVersionId = computed(
  () =>
    versions.value
      .slice()
      .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0].id
)

function loadLatestVersion() {
  switchModelToVersion(props.model.id, latestVersionId.value)
}

function handleVersionChange(versionId: string) {
  switchModelToVersion(props.model.id, versionId)
}

const onLoadMore = async () => {
  await loadMoreVersions(props.model.id)
  emit('loaded-more')
}
</script>
