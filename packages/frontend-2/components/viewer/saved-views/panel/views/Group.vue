<template>
  <LayoutDisclosure
    v-if="!isUngroupedGroup"
    v-model:open="open"
    :title="group.title"
    lazy-load
  >
    <ViewerSavedViewsPanelViewsGroupInner
      :group="group"
      :search="search"
      :only-authored="onlyAuthored"
    />
  </LayoutDisclosure>
  <ViewerSavedViewsPanelViewsGroupInner
    v-else
    :group="group"
    :search="search"
    :only-authored="onlyAuthored"
  />
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    isUngroupedViewsGroup
    ...ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup_Paginated on SavedViewGroup {
    id
    views(input: $savedViewsInput) {
      cursor
      totalCount
      items {
        id
        ...ViewerSavedViewsPanelView_SavedView
      }
    }
  }
`)

const props = defineProps<{
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
  search?: string
  onlyAuthored?: boolean
  isSelected?: boolean
}>()

const open = ref(false)

const isUngroupedGroup = computed(() => props.group.isUngroupedViewsGroup)

watch(
  () => props.isSelected,
  (isSelected) => {
    if (isSelected) {
      open.value = true
    }
  },
  { immediate: true }
)
</script>
