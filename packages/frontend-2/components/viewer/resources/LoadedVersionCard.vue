<template>
  <div
    class="p-2 min-w-0 max-w-full shadow rounded-lg flex items-center space-x-2 bg-foundation justify-between"
  >
    <div>
      <div class="w-20 h-20 shadow rounded-md bg-foundation">
        <PreviewImage :preview-url="previewUrl" />
      </div>
    </div>
    <div class="flex flex-col flex-grow space-y-1 min-w-0">
      <div class="font-bold text-lg">{{ model.name }}</div>
      <div class="flex items-center space-x-2">
        <div
          class="inline-block rounded-full px-2 text-xs bg-foundation-focus font-bold truncate"
        >
          {{ isLatest ? 'Latest' : timeAgoCreatedAt }}
        </div>
        <div class="inline-block rounded-full px-1 text-xs text-primary font-bold">
          {{ version.sourceApplication }}
        </div>
      </div>
      <div class="flex items-center space-x-2 min-w-0">
        <UserAvatar :user="author" size="sm" />
        <div class="text-xs text-foreground-2 truncate">{{ version.message }}</div>
      </div>
    </div>
    <div class="flex text-sm items-center space-x-2 flex-none">
      <FormButton
        rounded
        size="xs"
        :icon-left="ArrowPathRoundedSquareIcon"
        @click="$emit('show-versions')"
      >
        {{ model.versions?.totalCount }}
      </FormButton>
    </div>
  </div>
  <button
    v-if="!isLatest"
    class="block w-full transition bg-primary-muted hover:bg-foundation-focus text-xs text-foreground-2 py-1 text-center rounded-b-md"
    @click="$emit('load-latest')"
  >
    Load Latest Version
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ComputedRef } from 'vue'
import {
  LimitedUser,
  ModelCardModelFragment,
  ModelCardVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'
import { getPreviewUrl } from '~~/lib/viewer/helpers'

const props = defineProps<{
  version: ModelCardVersionFragment
  model: ModelCardModelFragment
}>()

defineEmits(['show-versions', 'load-latest'])

const loadedVersion = inject('loadedVersion') as ComputedRef<ModelCardVersionFragment>
const latestVersion = inject('latestVersion') as ComputedRef<ModelCardVersionFragment>
const projectId = inject('projectId') as string

const isLatest = computed(() => latestVersion.value.id === props.version.id)

const author = computed(() => {
  return {
    name: props.version.authorName,
    id: props.version.authorId,
    avatar: props.version.authorAvatar
  } as LimitedUser
})

const createdAt = computed(() =>
  dayjs(props.version.createdAt as string).format('DD MMM YY, h:mm A')
)

const timeAgoCreatedAt = computed(() =>
  dayjs(props.version.createdAt as string).from(dayjs())
)

const previewUrl = computed(() =>
  getPreviewUrl(projectId, props.version.referencedObject)
)
</script>
