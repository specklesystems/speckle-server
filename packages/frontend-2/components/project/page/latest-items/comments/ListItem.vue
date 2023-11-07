<template>
  <NuxtLink
    class="relative bg-foundation w-full py-1 px-2 flex sm:items-center space-x-2 rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary"
    :to="threadLink"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center flex-grow overflow-hidden space-x-2 mt-3 sm:mt-0"
    >
      <div class="flex items-center flex-none space-x-1 text-sm font-semibold">
        <UserAvatarGroup v-if="!thread.archived" :users="allAvatars" :max-count="4" />
        <CheckCircleIcon v-else class="w-8 h-8 text-primary" />
        <span>
          {{ thread.author.name }}
          <template v-if="threadAuthors.length !== 1">
            & {{ thread.replyAuthors.totalCount }} others
          </template>
        </span>
      </div>
      <div
        class="min-w-0 max-w-full truncate text-sm flex-auto text-foreground-2 mt-2 sm:mt-0"
      >
        {{ thread.rawText }}
      </div>
    </div>
    <div class="flex space-x-4 items-center flex-none pb-8 sm:pb-0">
      <div class="absolute sm:relative w-full bottom-2 sm:bottom-0 left-0 px-2 gap-8">
        <div class="w-full px-2 flex justify-between text-xs">
          {{ updatedAt }}
          <span class="ml-4 text-xs font-bold text-primary">
            {{ thread.repliesCount.totalCount }}
            {{ thread.repliesCount.totalCount === 1 ? 'reply' : 'replies' }}
          </span>
        </div>
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
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { AvatarUserWithId } from '@speckle/ui-components'

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

const allAvatars = computed((): AvatarUserWithId[] => [
  ...threadAuthors.value,
  // We're adding fake entries so that the proper "+X" number is rendered, and the actual data is
  // not really important because it's never going to be rendered
  ...times(
    hiddenReplyAuthorCount.value,
    (): AvatarUserWithId => ({ id: 'fake', name: 'fake' })
  )
])

const threadLink = computed(() => getLinkToThread(props.projectId, props.thread))
</script>
