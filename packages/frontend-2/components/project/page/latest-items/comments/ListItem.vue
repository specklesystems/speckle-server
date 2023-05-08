<template>
  <NuxtLink
    class="bg-foundation w-full py-1 pl-2 flex items-center space-x-2 rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary"
    :to="threadLink"
  >
    <div class="flex items-center flex-grow overflow-hidden space-x-2">
      <div class="flex items-center flex-none space-x-1 text-sm font-semibold">
        <UserAvatarGroup v-if="!thread.archived" :users="allAvatars" :max-count="4" />
        <CheckCircleIcon v-else class="w-8 h-8 text-primary" />
        <span class="hidden md:inline-block">
          {{ thread.author.name }}
          <template v-if="threadAuthors.length !== 1">
            & {{ thread.replyAuthors.totalCount }} others
          </template>
        </span>
      </div>
      <div class="min-w-0 max-w-full truncate text-sm flex-auto text-foreground-2">
        {{ thread.rawText }}
      </div>
    </div>
    <div class="flex space-x-4 items-center flex-none">
      <div class="space-x-8">
        <span class="text-xs">
          {{ updatedAt }}
          <span class="ml-4 text-xs font-bold text-primary">
            {{ thread.repliesCount.totalCount }}
            {{ thread.repliesCount.totalCount === 1 ? 'reply' : 'replies' }}
          </span>
        </span>
      </div>
      <div
        class="bg-cover bg-no-repeat bg-center w-20 h-20 rounded-md"
        :style="{ backgroundImage }"
      />
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { times } from 'lodash-es'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
import { AvatarUserType } from '~~/lib/user/composables/avatar'
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
  projectId: string
}>()

const { backgroundImage } = useCommentScreenshotImage(
  computed(() => props.thread.screenshot)
)

const updatedAt = computed(() => dayjs(props.thread.updatedAt).from(dayjs()))
const hiddenReplyAuthorCount = computed(
  () => props.thread.replyAuthors.totalCount - props.thread.replyAuthors.items.length
)

// Combined thread authors set of (original author + any respondents)
const threadAuthors = computed(() => {
  const authors = [props.thread.author]
  for (const author of props.thread.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})

const allAvatars = computed((): AvatarUserType[] => [
  ...threadAuthors.value,
  // We're adding fake entries so that the proper "+X" number is rendered, and the actual data is
  // not really important because it's never going to be rendered
  ...times(
    hiddenReplyAuthorCount.value,
    (): AvatarUserType => ({ id: 'fake', name: 'fake' })
  )
])

const threadLink = computed(() => getLinkToThread(props.projectId, props.thread))
</script>
