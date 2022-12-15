<template>
  <tr class="h-[62px] bg-foundation">
    <td class="normal text-foreground font-semibold">
      <div class="inline-flex align-middle items-center space-x-1 pl-5 pr-8 w-[250px]">
        <UserAvatar size="20" no-border :avatar-url="thread.author.avatar" />
        <span class="truncate">{{ thread.author.name }}</span>
      </div>
    </td>
    <td class="normal text-foreground truncate pr-5">
      {{ thread.rawText }}
    </td>
    <td class="text-foreground-2 normal pr-5 text-center xl:text-left">
      {{ createdAt }}
    </td>
    <td class="text-foreground normal pr-5">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ChatBubbleLeftEllipsisIcon class="h-5 w-5" />
        <span>120</span>
      </div>
    </td>
    <td class="pr-5">
      <div
        v-if="thread.replyAuthors.totalCount"
        ref="elementToWatchForChanges"
        class="flex space-x-[1px] align-middle"
      >
        <div
          ref="itemContainer"
          class="flex space-x-[1px] flex-wrap overflow-hidden h-8"
        >
          <UserAvatar
            v-for="author in thread.replyAuthors.items"
            :key="author.id"
            :avatar-url="author.avatar"
            no-border
          />
        </div>
        <UserAvatarText
          v-if="hiddenReplyAuthorCount"
          class="text-foreground label label--light"
        >
          +{{ hiddenReplyAuthorCount }}
        </UserAvatarText>
      </div>
    </td>
    <td class="bg-cover bg-no-repeat bg-center" :style="{ backgroundImage }" />
  </tr>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { useWrappingContainerHiddenCount } from '~~/lib/layout/composables/resize'
import dayjs from 'dayjs'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
}>()

const { backgroundImage } = useCommentScreenshotImage(
  computed(() => props.thread.screenshot)
)

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { hiddenItemCount } = useWrappingContainerHiddenCount({
  elementToWatchForChanges,
  itemContainer,
  trackResize: true,
  trackMutations: false
})

const createdAt = computed(() => dayjs(props.thread.createdAt).from(dayjs()))
const hiddenReplyAuthorCount = computed(
  () =>
    props.thread.replyAuthors.totalCount -
    props.thread.replyAuthors.items.length +
    hiddenItemCount.value
)
</script>
