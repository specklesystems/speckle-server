<template>
  <div class="flex flex-col items-center">
    <!-- <div class="xxx-bg-foundation rounded-full caption space-x-2 p-1">
      <span>{{ absoluteDate }}</span>
      <span>{{ timeFromNow }}</span>
    </div> -->
    <div class="xxx-bg-foundation sm:rounded-xl p-4 sm:pb-2 w-full relative">
      <div class="flex items-center space-x-1">
        <UserAvatar :user="comment.author" hide-tooltip class="mr-1" />
        <span class="grow truncate text-xs sm:text-sm font-medium">
          {{ comment.author.name }}
        </span>
        <span
          v-tippy="createdAt.full"
          class="text-xs truncate text-foreground-2 font-medium"
        >
          {{ createdAt.relative }}
        </span>
        <!-- Note: disabled as archiving comments is now equivalent to "resolving" them. -->
        <!-- <div class="pl-2">
          <CommonTextLink
            v-if="canArchive"
            class="absolute text-foreground-2 top-3 right-3"
            @click="() => archiveComment(comment.id)"
          >
            <TrashIcon class="h-3 w-3" />
          </CommonTextLink>
        </div> -->
      </div>
      <div class="truncate text-xs sm:text-sm text-foreground flex flex-col mt-2">
        <CommonTiptapTextEditor
          v-if="comment.text.doc"
          :model-value="comment.text.doc"
          :schema-options="{ multiLine: false }"
          :project-id="projectId"
          disable-invitation-cta
          readonly
          @created="emit('mounted')"
        />
        <ViewerAnchoredPointThreadCommentAttachments
          :attachments="comment"
          :project-id="projectId"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// import { Roles } from '@speckle/shared'
// import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { ViewerCommentsReplyItemFragment } from '~~/lib/common/generated/gql/graphql'
// import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
// import { useArchiveComment } from '~~/lib/viewer/composables/commentManagement'

const props = defineProps<{
  comment: ViewerCommentsReplyItemFragment
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'mounted'): void
}>()

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.comment.createdAt),
    relative: formattedRelativeDate(props.comment.createdAt, { capitalize: true })
  }
})

// const archiveComment = useArchiveComment()
// const { activeUser } = useActiveUser()
// const {
//   resources: {
//     response: { project }
//   }
// } = useInjectedViewerState()

// const canArchive = computed(
//   () =>
//     !props.comment.archived &&
//     activeUser.value &&
//     (props.comment.author.id === activeUser.value.id ||
//       project.value?.role === Roles.Stream.Owner)
// )
// const absoluteDate = computed(() =>
//   dayjs(props.comment.createdAt).toDate().toLocaleString()
// )
</script>
