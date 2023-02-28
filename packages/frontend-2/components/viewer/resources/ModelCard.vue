<template>
  <div>
    <div v-if="model">
      <div>
        <ViewerResourcesLoadedVersionCard
          v-if="!showVersions && loadedVersion"
          :version="loadedVersion"
          :model="model"
          :is-latest-version="loadedVersion?.id === latestVersionId"
          @show-versions="showVersions = true"
          @load-latest="loadLatestVersion"
        />
      </div>
    </div>
    <div v-if="showVersions" class="bg-foundation flex flex-col rounded-md px-1">
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
      <div>
        <ViewerResourcesVersionCard
          v-for="version in versions"
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
          {{ showLoadMore ? 'View older versions' : 'No more versions to load' }}
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
