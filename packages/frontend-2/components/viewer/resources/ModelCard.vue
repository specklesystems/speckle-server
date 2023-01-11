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
        v-if="loadedVersion"
        :model-id="modelId"
        :is-latest-version="loadedVersion.id === latestVersionId"
        :version="loadedVersion"
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
          :model-id="modelId"
          :version="version"
          :is-latest-version="version.id === latestVersionId"
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
import {
  ChevronDownIcon,
  ArrowPathRoundedSquareIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'
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

const latestVersionId = computed(
  () =>
    versions.value
      .slice()
      .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0].id
)

const updatedAt = computed(() =>
  props.model ? dayjs(props.model.updatedAt).from(dayjs()) : null
)

function handleVersionChange(versionId: string) {
  switchModelToVersion(props.model.id, versionId)
}
</script>
