<template>
  <tr class="h-[62px] bg-foundation">
    <td class="normal text-foreground font-semibold">
      <div class="inline-flex align-middle items-center space-x-1 pl-5 pr-8 w-[250px]">
        <UserAvatar no-border :user="thread.author" />
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
        <span>{{ thread.repliesCount }}</span>
      </div>
    </td>
    <td class="pr-5">
      <UserAvatarGroup :users="allAvatars" :max-count="4" />
    </td>
    <td class="bg-cover bg-no-repeat bg-center" :style="{ backgroundImage }" />
  </tr>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/vue/24/solid'
import dayjs from 'dayjs'
import { times } from 'lodash-es'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
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
