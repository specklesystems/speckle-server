<template>
  <NuxtLink
    class="group relative h-60 rounded-md flex items-stretch overflow-hidden transition-all border border-outline-3 hover:border-outline-5 bg-foundation-page"
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
        <div class="mt-2 p-2 bg-foundation-2 border-t">
          <div class="truncate text-body-xs text-foreground-3">
            {{ thread.rawText }}
          </div>
          <div class="space-x-2">
            <span class="text-body-2xs font-medium text-primary">
              {{ thread.repliesCount.totalCount }}
              {{ thread.repliesCount.totalCount === 1 ? 'reply' : 'replies' }}
            </span>
            <span v-tippy="updatedAt.full" class="text-foreground-2 text-body-2xs">
              {{ updatedAt.relative }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
import type { ProjectPageLatestItemsCommentItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
import { times } from 'lodash-es'
import { getLightLinkToThread } from '~~/lib/viewer/helpers/comments'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import type { AvatarUserWithId } from '@speckle/ui-components'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
  projectId: string
}>()

const { screenshot } = useCommentScreenshotImage(
  computed(() => props.thread.screenshot)
)

const hiddenReplyAuthorCount = computed(
  () => props.thread.replyAuthors.totalCount - props.thread.replyAuthors.items.length
)

const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.thread.updatedAt),
    relative: formattedRelativeDate(props.thread.updatedAt, { capitalize: true })
  }
})

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

const threadLink = computed(() =>
  getLightLinkToThread(props.projectId, props.thread.id)
)
</script>
