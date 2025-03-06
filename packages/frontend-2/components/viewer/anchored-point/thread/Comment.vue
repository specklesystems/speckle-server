<template>
  <div class="flex flex-col items-center">
    <div class="w-full relative" :class="isEmbedEnabled ? 'px-2 py-1' : 'px-4 py-2'">
      <div class="flex items-center space-x-2">
        <UserAvatar
          :user="comment.author"
          hide-tooltip
          :class="isEmbedEnabled && '!w-7 !h-7'"
        />
        <span class="grow truncate text-body-xs">
          {{ comment.author.name }}
        </span>
        <span v-tippy="createdAt.full" class="text-body-3xs truncate text-foreground-2">
          {{ createdAt.relative }}
        </span>
      </div>
      <div
        class="truncate text-body-2xs text-foreground-2 flex flex-col"
        :class="isEmbedEnabled ? 'mt-2' : 'mt-3'"
      >
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
import type { ViewerCommentsReplyItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

const props = defineProps<{
  comment: ViewerCommentsReplyItemFragment
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'mounted'): void
}>()

const { isEmbedEnabled } = useEmbed()

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.comment.createdAt),
    relative: formattedRelativeDate(props.comment.createdAt, { capitalize: true })
  }
})
</script>
