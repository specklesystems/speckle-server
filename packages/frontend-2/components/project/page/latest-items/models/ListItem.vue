<template>
  <tr class="h-[62px] bg-foundation">
    <td class="p-0">
      <ClientOnly>
        <div
          v-if="previewUrl"
          class="h-[62px] bg-contain bg-no-repeat bg-center w-full"
          :style="{ backgroundImage: `url('${previewUrl}')` }"
        ></div>
      </ClientOnly>
    </td>
    <td><!-- Fake padding (see thead) --></td>
    <td class="normal truncate pr-5">
      {{ model.name }}
    </td>
    <td class="text-foreground-2 normal">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span>{{ model.versionCount }}</span>
      </div>
    </td>
    <td class="text-foreground normal pr-5">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ChatBubbleLeftEllipsisIcon class="h-5 w-5" />
        <span>{{ model.commentThreadCount }}</span>
      </div>
    </td>
    <td class="pr-5">{{ updatedAt }}</td>
    <td>{{ createdAt }}</td>
  </tr>
</template>
<script setup lang="ts">
import {
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/vue/24/solid'
import { ProjectPageLatestItemsModelItemFragment } from '~~/lib/common/generated/gql/graphql'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'
import dayjs from 'dayjs'

const props = defineProps<{
  model: ProjectPageLatestItemsModelItemFragment
}>()

const basePreviewUrl = computed(() => props.model.previewUrl)
const { previewUrl } = usePreviewImageBlob(basePreviewUrl)

const createdAt = computed(() => dayjs(props.model.createdAt).from(dayjs()))
const updatedAt = computed(() => dayjs(props.model.updatedAt).from(dayjs()))
</script>
