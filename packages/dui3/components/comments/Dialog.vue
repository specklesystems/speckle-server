<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <LayoutDialog
      v-model:open="showCommentsDialog"
      :title="`Comments`"
      fullscreen="none"
    >
      <CommentsThreadItem
        v-for="thread in threads"
        :key="thread.id"
        :thread="thread"
        :model-card="modelCard"
      ></CommentsThreadItem>
    </LayoutDialog>
  </div>
</template>

<script setup lang="ts">
import type { CommentThreadsItemFragment } from '~/lib/common/generated/gql/graphql'
import type { ModelCard } from '~/lib/models/card'

defineProps<{
  modelCard: ModelCard
  threads: CommentThreadsItemFragment[]
}>()

const showCommentsDialog = ref(false)

const toggleDialog = () => {
  showCommentsDialog.value = !showCommentsDialog.value
}
</script>
