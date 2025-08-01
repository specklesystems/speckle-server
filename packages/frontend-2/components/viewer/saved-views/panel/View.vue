<template>
  <div class="flex gap-2 w-full">
    <img
      :src="view.screenshot"
      alt="View screenshot"
      class="w-20 h-14 object-cover rounded border border-outline-3 bg-foundation-page"
    />
    <div class="flex flex-col gap-1 min-w-0">
      <div class="text-body-2xs font-medium text-foreground truncate grow-0">
        {{ view.name }}
      </div>
      <div class="text-body-2xs text-foreground-3 truncate">
        {{ view.author?.name }}
      </div>
      <div
        v-tippy="formattedFullDate(view.updatedAt)"
        class="text-body-2xs text-foreground-3 truncate"
      >
        {{ formattedRelativeDate(view.updatedAt) }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelView_SavedViewFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ViewerSavedViewsPanelView_SavedView on SavedView {
    id
    name
    description
    screenshot
    author {
      id
      name
    }
    updatedAt
  }
`)

defineProps<{
  view: ViewerSavedViewsPanelView_SavedViewFragment
}>()
</script>
