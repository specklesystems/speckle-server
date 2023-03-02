<template>
  <div class="rounded-lg group">
    <div
      class="relative p-2 min-w-0 h-16 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-foundation justify-between z-20"
    >
      <div>
        <UserAvatar :user="author" />
      </div>
      <div class="flex flex-col flex-grow space-y-0 min-w-0">
        <!-- <div class="text-xs text-foreground-2 truncate">
          {{ modelName.subheader }}
        </div> -->
        <span v-tippy="modelName.subheader ? model.name : null" class="font-bold">
          {{ modelName.header }}
        </span>
        <div class="text-xs text-foreground-2 truncate">{{ version.message }}</div>
      </div>
      <div class="flex text-sm items-center space-x-2 flex-none">
        <FormButton
          rounded
          size="xs"
          text
          :icon-left="ArrowPathRoundedSquareIcon"
          :disabled="model.versions.totalCount <= 1"
          @click="$emit('show-versions')"
        >
          {{ model.versions?.totalCount }}
        </FormButton>
      </div>
    </div>
    <!-- <FormButton class="absolute top-0 right-0 z-20 group-hover:opacity-100" rounded size="xs">
      <XMarkIcon class="w-3 h-3" />
    </FormButton> -->
    <button
      v-if="!isLatest"
      class="relative -mt-2 pt-3 pb-1 block w-full shadow-md transition bg-foundation hover:bg-foundation-focus text-xs text-foreground-2 text-center rounded-b-md z-10"
      @click="$emit('load-latest')"
    >
      Load Latest Version
    </button>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
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
  isLatestVersion: boolean
}>()

defineEmits(['show-versions', 'load-latest'])

const isLatest = computed(() => props.isLatestVersion)

const author = computed(() => props.version.authorUser)

const timeAgoCreatedAt = computed(() =>
  dayjs(props.version.createdAt as string).from(dayjs())
)

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
