<template>
  <div class="group">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`rounded-lg group pb-4  simple-scrollbar overflow-y-auto ${
        showVersions ? 'h-96' : 'h-24 hover:h-28'
      }  transition-[height] cursor-pointer`"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div
        class="p-2 min-w-0 h-20 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-foundation justify-between z-20 sticky top-0"
        @click="showVersions = !showVersions"
      >
        <div>
          <UserAvatar :user="loadedVersion?.authorUser" />
        </div>
        <div class="flex flex-col flex-grow space-y-0 min-w-0">
          <!-- <div>
            <span class="text-xs font-semibold">two weeks behind latest</span>
          </div> -->
          <div>
            <span v-tippy="modelName.subheader ? model.name : null" class="font-bold">
              {{ modelName.header }}
            </span>
          </div>
          <!-- <div class="text-xs text-foreground-2 truncate">
            {{ loadedVersion?.message }}
          </div> -->
          <div class="text-xs text-foreground-2 truncate">
            <span class="text-xs font-semibold">two weeks behind latest</span>
          </div>
        </div>
        <div
          v-if="!showVersions"
          class="opacity-0 group-hover:opacity-100 transition-opacity flex text-xs font-bold items-center space-x-1 flex-none"
        >
          <span>{{ model.versions?.totalCount }}</span>
          <ArrowPathRoundedSquareIcon class="w-4 h-4" />
        </div>
        <div
          v-else
          class="opacity-0 group-hover:opacity-100 transition-opacity flex text-xs font-bold items-center space-x-2 flex-none"
        >
          <XMarkIcon class="w-4 h-4" />
        </div>
      </div>

      <!-- Versions Stack Effect -->
      <div v-if="model.versions?.totalCount > 1 && !showVersions">
        <div
          class="absolute transition-all top-[10px] group-hover:top-[15px] scale-95 w-full h-20 rounded-lg shadow-md bg-foundation z-10 opacity-70"
        ></div>
        <div
          class="absolute transition-all top-[16px] group-hover:top-[28px] scale-90 w-full h-20 rounded-lg shadow-md bg-foundation opacity-70"
        ></div>
        <!-- <div
          class="absolute transition-all bottom-8 group-hover:bottom-10 scale-90 w-full h-20 rounded-lg shadow-md bg-foundation"
        ></div> -->
      </div>

      <div v-show="showVersions" class="flex flex-col space-y-2 mt-2 mr-1 h-96">
        <ViewerResourcesVersionCard3
          v-for="version in props.model.versions.items"
          :key="version.id"
          :model-id="modelId"
          :version="version"
          :is-latest-version="version.id === latestVersionId"
          :is-loaded-version="version.id === loadedVersion?.id"
          @change-version="handleVersionChange"
        />
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
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import {
  ChevronLeftIcon,
  XMarkIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/vue/24/solid'
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

const latestVersion = computed(() => {
  return versions.value
    .slice()
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0]
})

const latestVersionId = computed(() => latestVersion.value.id)

const modelName = computed(() => {
  const parts = props.model.name.split('/')
  if (parts.length > 1) {
    const name = parts[parts.length - 1]
    parts.pop()
    return {
      subheader: parts.join('/'),
      header: name
    }
  } else {
    return {
      subheader: null,
      header: props.model.name
    }
  }
})

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
