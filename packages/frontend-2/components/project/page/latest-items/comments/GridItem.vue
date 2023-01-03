<template>
  <div
    class="h-40 rounded-lg bg-foundation shadow flex items-stretch hover:shadow-md ring-outline-2 hover:ring-2"
  >
    <!-- Main data -->
    <div class="grow flex flex-col justify-between py-2 px-6 min-w-0">
      <div class="flex flex-col">
        <div class="flex space-x-1 items-center mb-2">
          <UserAvatar no-border :user="thread.author" />
          <span
            class="normal font-semibold text-foreground whitespace-nowrap text-ellipsis overflow-hidden"
          >
            {{ thread.author.name }}
          </span>
        </div>
        <div
          class="normal text-foreground whitespace-nowrap text-ellipsis overflow-hidden"
        >
          {{ thread.rawText }}
        </div>
        <div class="caption text-foreground-2">{{ createdAt }}</div>
      </div>
      <div
        class="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-2.5"
      >
        <div class="flex items-center space-x-2.5">
          <div class="text-foreground inline-flex items-center">
            <ChatBubbleLeftEllipsisIcon class="w-4 h-4 mr-1" />
            <span class="caption">{{ thread.repliesCount }}</span>
          </div>
          <LinkIcon class="w-4 h-4" />
        </div>

        <UserAvatarGroup :users="allAvatars" :max-count="4" />
      </div>
    </div>
    <!-- Image preview -->
    <div
      class="shrink-0 w-[25%] sm:w-36 border-l border-outline-3 bg-no-repeat bg-center bg-cover"
      :style="{ backgroundImage }"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon, LinkIcon } from '@heroicons/vue/24/solid'
import dayjs from 'dayjs'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
import { times } from 'lodash-es'
import { AvatarUserType } from '~~/lib/user/composables/avatar'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
}>()

const { backgroundImage } = useCommentScreenshotImage(
  computed(() => props.thread.screenshot)
)

const createdAt = computed(() => dayjs(props.thread.createdAt).from(dayjs()))
const hiddenReplyAuthorCount = computed(
  () => props.thread.replyAuthors.totalCount - props.thread.replyAuthors.items.length
)

const allAvatars = computed((): AvatarUserType[] => [
  ...props.thread.replyAuthors.items,
  // We're adding fake entries so that the proper "+X" number is rendered, and the actual data is
  // not really important because it's never going to be rendered
  ...times(
    hiddenReplyAuthorCount.value,
    (): AvatarUserType => ({ id: 'fake', name: 'fake' })
  )
])
</script>
