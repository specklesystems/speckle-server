<template>
  <LayoutDisclosure :title="group.title">Hey</LayoutDisclosure>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    title
  }
`)

defineProps<{
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
}>()
</script>
