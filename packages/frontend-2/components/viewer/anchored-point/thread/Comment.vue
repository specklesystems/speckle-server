<template>
  <div class="flex flex-col items-center">
    <div class="w-full relative py-2 flex items-start gap-x-2">
      <UserAvatar :user="comment.author" hide-tooltip size="sm" class="!size-7" />
      <div class="pt-1">
        <div class="flex items-center space-x-2">
          <span class="truncate text-body-2xs font-medium">
            {{ comment.author.name }}
          </span>
          <span
            v-tippy="createdAt.full"
            class="text-body-2xs truncate text-foreground-2"
          >
            {{ createdAt.relative }}
          </span>
        </div>
        <div
          class="truncate text-body-2xs text-foreground dark:text-foreground-2 flex flex-col pt-2"
        >
          <template v-if="isLimited">
            <ViewerResourcesLimitAlert limit-type="comment" :project="project" />
          </template>
          <template v-else>
            <CommonTiptapTextEditor
              v-if="comment?.text?.doc"
              :model-value="comment.text.doc"
              :schema-options="{ multiLine: false }"
              :project-id="projectId"
              disable-invitation-cta
              readonly
              @created="emit('mounted')"
            />
          </template>

          <ViewerAnchoredPointThreadCommentAttachments
            :attachments="comment"
            :project-id="projectId"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ViewerCommentsReplyItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const props = defineProps<{
  comment: ViewerCommentsReplyItemFragment
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'mounted'): void
}>()

const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.comment.createdAt),
    relative: formattedRelativeDate(props.comment.createdAt, { capitalize: true })
  }
})

const isLimited = computed(() => !props.comment.text)
</script>
