<template>
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
    <div class="space-y-0">
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
    <div class="mt-4 text-xs text-center py-2 text-foreground-2">
      TODO: Version Pagination
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { useViewerResourcesState } from '~~/lib/viewer/composables/viewer'
import { ViewerModelCardsQuery } from '~~/lib/common/generated/gql/graphql'
import { Get } from 'type-fest'

type ModelItem = NonNullable<Get<ViewerModelCardsQuery, 'project.models.items[0]'>>

const props = defineProps<{
  model: ModelItem
  versionId: string
}>()

const { switchModelToVersion } = useViewerResourcesState()

const showVersions = ref(false)

graphql(`
  fragment ViewerModelCardItem on Model {
    id
    name
    updatedAt
    versions {
      totalCount
      items {
        ...ViewerModelVersionCardItem
      }
    }
  }

  fragment ViewerModelVersionCardItem on Version {
    id
    message
    referencedObject
    sourceApplication
    createdAt
    authorUser {
      ...LimitedUserAvatar
    }
  }
`)

const modelId = computed(() => props.model.id)
const versions = computed(() => props.model.versions?.items || [])

const loadedVersion = computed(() =>
  versions.value.find((v) => v.id === props.versionId)
)

const versionsExceptLoaded = computed(() =>
  versions.value.filter((v) => v.id !== loadedVersion.value?.id)
)

const latestVersionId = computed(
  () =>
    versions.value
      .slice()
      .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0].id
)

const updatedAt = computed(() =>
  props.model ? dayjs(props.model.updatedAt).from(dayjs()) : null
)

function loadLatestVersion() {
  switchModelToVersion(props.model.id, latestVersionId.value)
}

function handleVersionChange(versionId: string) {
  switchModelToVersion(props.model.id, versionId)
}
</script>
