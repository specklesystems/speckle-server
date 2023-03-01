<template>
  <div class="rounded-lg">
    <div
      class="relative p-2 min-w-0 max-w-full rounded-lg shadow-md flex items-center space-x-2 bg-foundation justify-between z-20"
    >
      <div>
        <UserAvatar :user="author" />
      </div>
      <div class="flex flex-col flex-grow space-y-0 min-w-0">
        <div class="font-bold text-lg">{{ model.name }}</div>
        <div class="flex items-center space-x-2 min-w-0">
          <div class="text-xs text-foreground-2 truncate">{{ version.message }}</div>
        </div>
      </div>
      <div class="flex text-sm items-center space-x-2 flex-none">
        <FormButton
          rounded
          size="xs"
          :icon-left="ArrowPathRoundedSquareIcon"
          :disabled="model.versions.totalCount <= 1"
          @click="$emit('show-versions')"
        >
          {{ model.versions?.totalCount }}
        </FormButton>
      </div>
    </div>
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
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'
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
</script>
