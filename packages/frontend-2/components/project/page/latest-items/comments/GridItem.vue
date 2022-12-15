<template>
  <div class="h-36 rounded-lg bg-foundation shadow flex items-stretch">
    <!-- Main data -->
    <div class="grow flex flex-col justify-between py-2 px-6 min-w-0">
      <div class="flex flex-col">
        <div class="flex space-x-1 items-center mb-2">
          <UserAvatar size="24" no-border :avatar-url="thread.author.avatar" />
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
      <div class="flex items-center space-x-2.5">
        <div class="text-foreground inline-flex items-center">
          <ChatBubbleLeftEllipsisIcon class="w-4 h-4 mr-1" />
          <span class="caption">{{ thread.repliesCount }}</span>
        </div>
        <LinkIcon class="w-4 h-4" />
        <div v-if="thread.replyAuthors.totalCount" class="flex -space-x-1 relative">
          <UserAvatar
            v-for="(author, i) in thread.replyAuthors.items"
            :key="author.id"
            size="24"
            :style="{ zIndex: i + 1 }"
          />
          <UserAvatarText
            v-if="hiddenReplyAuthorCount > 0"
            class="text-foreground normal"
          >
            +{{ hiddenReplyAuthorCount }}
          </UserAvatarText>
        </div>
      </div>
    </div>
    <!-- Image preview -->
    <div
      class="shrink-0 w-36 border-l border-outline-3 bg-no-repeat bg-center bg-cover"
      :style="{ backgroundImage }"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon, LinkIcon } from '@heroicons/vue/24/solid'
import dayjs from 'dayjs'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'

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
</script>
