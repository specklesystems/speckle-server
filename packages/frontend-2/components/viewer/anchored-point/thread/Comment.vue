<template>
  <div class="flex flex-col items-center">
    <div class="p-4 py-2 w-full relative">
      <div class="flex items-center space-x-2">
        <UserAvatar :user="comment.author" hide-tooltip />
        <span class="grow truncate text-body-xs">
          {{ comment.author.name }}
        </span>
        <span v-tippy="createdAt.full" class="text-body-3xs truncate text-foreground-2">
          {{ createdAt.relative }}
        </span>
      </div>
      <div class="truncate text-body-2xs text-foreground-2 flex flex-col mt-3">
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
