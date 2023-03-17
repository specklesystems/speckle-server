<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
  <div
    :class="`rounded-lg group pb-4 h-20 ${
      showVersions ? 'h-96' : 'hover:h-24'
    }  transition-[height] cursor-pointer`"
    @click="showVersions = !showVersions"
  >
    <div
      class="relative p-2 min-w-0 h-16 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-foundation justify-between z-20"
    >
      <div>
        <UserAvatar :user="author" />
      </div>
      <div class="flex flex-col flex-grow space-y-0 min-w-0">
        <span v-tippy="modelName.subheader ? model.name : null" class="font-bold">
          {{ modelName.header }}
        </span>
        <div class="text-xs text-foreground-2 truncate">{{ version.message }}</div>
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

    <div
      v-if="model.versions?.totalCount > 1 && !showVersions"
      class="relative transition-all -top-14 group-hover:-top-12 scale-95 w-full p-2 h-16 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-primary-muted group-hover:bg-foundation justify-between z-10"
    ></div>
    <div
      v-if="model.versions?.totalCount > 1 && !showVersions"
      class="relative transition-all -top-28 group-hover:-top-24 scale-90 w-full p-2 h-16 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-primary-muted group-hover:bg-foundation justify-between"
    ></div>
    <div v-if="showVersions" class="flex flex-col space-y-2 mt-2">
      <ViewerResourcesVersionCard3
        v-for="version in props.model.versions.items"
        :key="version.id"
        :model-id="props.model.id"
        :version="version"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
// import dayjs from 'dayjs'
import {
  ViewerModelVersionCardItemFragment,
  ViewerLoadedResourcesQuery
} from '~~/lib/common/generated/gql/graphql'
import { ArrowPathRoundedSquareIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { Get } from 'type-fest'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const props = defineProps<{
  version: ViewerModelVersionCardItemFragment
  model: ModelItem
}>()

defineEmits(['show-versions', 'load-latest'])

const isLatest = computed(() => props.isLatestVersion)

const versionItems = computed(() => props.model.versions.items)

const showVersions = ref(false)

const author = computed(() => props.version.authorUser)

// const timeAgoCreatedAt = computed(() =>
//   dayjs(props.version.createdAt as string).from(dayjs())
// )

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
</script>
