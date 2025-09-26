<template>
  <NuxtLink
    class="group relative h-60 rounded-md flex flex-col overflow-hidden transition-all border border-outline-3 bg-foundation-page"
    :to="isLimited ? undefined : threadLink"
    :class="isLimited ? 'cursor-default' : 'cursor-pointer hover:border-outline-5'"
  >
    <!-- Image preview -->
    <div v-if="!isLimited" class="w-full h-44 overflow-hidden">
      <div
        class="w-full h-full cover scale-125 group-hover:scale-100 transition"
        :style="{
          backgroundImage: `url(${screenshot})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }"
      />
    </div>
    <div
      v-else
      class="w-full h-48 flex items-center justify-center diagonal-stripes px-3 pb-8"
    >
      <ViewerResourcesLimitAlert limit-type="comment" :project="project" />
    </div>
    <div class="flex items-center w-full px-3 h-8 -mt-10 relative">
      <UserAvatarGroup
        v-if="!thread.archived"
        v-tippy="
          `${thread.author.name} ${
            allAvatars.length !== 1 ? '& ' + (allAvatars.length - 1) + ' others' : ''
          }`
        "
        :users="allAvatars"
        :max-count="4"
      />
      <CircleCheck
        v-else
        :size="32"
        :stroke-width="1.5"
        :absolute-stroke-width="true"
        class="text-primary"
      />
    </div>
    <div class="w-full" :class="isLimited ? 'h-14' : 'h-16'">
      <div class="flex flex-col w-full h-full">
        <div class="mt-2 py-2 px-4 bg-foundation border-t h-full">
          <div v-if="!isLimited" class="truncate text-body-xs text-foreground">
            {{ thread.rawText }}
          </div>
          <div class="space-x-2" :class="isLimited ? 'mt-0.5' : ''">
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
import type {
  ProjectPageLatestItemsCommentItemFragment,
  ViewerResourcesLimitAlert_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { useCommentScreenshotImage } from '~~/lib/projects/composables/previewImage'
import { times } from 'lodash-es'
import { getLightLinkToThread } from '~~/lib/viewer/helpers/comments'
import { CircleCheck } from 'lucide-vue-next'
import type { AvatarUserWithId } from '@speckle/ui-components'

const props = defineProps<{
  thread: ProjectPageLatestItemsCommentItemFragment
  project: ViewerResourcesLimitAlert_ProjectFragment
  projectId: string
}>()

const { screenshot } = useCommentScreenshotImage(
  computed(() => props.thread.screenshot)
)
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const isLimited = computed(() => {
  return !props.thread.rawText
})

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
