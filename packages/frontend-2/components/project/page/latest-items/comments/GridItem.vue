<template>
  <NuxtLink
    class="group relative h-60 rounded-lg bg-foundation shadow flex items-stretch hover:shadow-md ring-outline-2 hover:ring-2 overflow-hidden transition"
    :to="threadLink"
  >
    <!-- Image preview -->
    <div
      class="absolute w-full h-full cover scale-125 group-hover:scale-100 transition xxxduration-700"
      :style="{
        backgroundImage: `url(${screenshot})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
      }"
    ></div>
    <div class="absolute w-full h-full flex items-end">
      <div class="flex flex-col w-full">
        <div class="flex items-center w-full px-2">
          <UserAvatarGroup
            v-if="!thread.archived"
            v-tippy="
              `${thread.author.name} ${
                allAvatars.length !== 1
                  ? '& ' + (allAvatars.length - 1) + ' others'
                  : ''
              }`
            "
            :users="allAvatars"
            :max-count="4"
          />
          <CheckCircleIcon v-else class="w-8 h-8 text-primary" />
        </div>
        <div
          class="mt-2 p-2 transition-all bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-t-lg dark:group-hover:bg-neutral-800 group-hover:bg-foundation"
        >
          <div class="truncate text-sm">{{ thread.rawText }}</div>
          <div class="space-x-1">
            <span class="text-xs font-bold text-primary">
              {{ thread.repliesCount.totalCount }}
              {{ thread.repliesCount.totalCount === 1 ? 'reply' : 'replies' }}
            </span>
            <span class="text-xs">
              {{ updatedAt }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
import { times } from 'lodash-es'
import { AvatarUserType } from '~~/lib/user/composables/avatar'
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
  projectId: string
}>()

const { screenshot } = useCommentScreenshotImage(
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
