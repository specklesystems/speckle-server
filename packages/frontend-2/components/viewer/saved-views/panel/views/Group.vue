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
    <template #title-actions>
      <div
        class="flex gap-1 items-center opacity-0 group-hover/disclosure:opacity-100"
        @click.stop
      >
        <FormButton size="sm" color="subtle" :icon-left="Ellipsis" hide-text />
        <div v-tippy="canUpdate?.errorMessage">
          <FormButton
            size="sm"
            color="subtle"
            :icon-left="Plus"
            hide-text
            name="addGroupView"
            :disabled="!canUpdate.authorized || isLoading"
            @click="onAddGroupView"
          />
        </div>
      </div>
    </template>
  </LayoutDisclosure>
  <ViewerSavedViewsPanelViewsGroupInner
    v-else
    :group="group"
    :search="search"
    :only-authored="onlyAuthored"
  />
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { Ellipsis, Plus } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'
import { useCreateSavedView } from '~/lib/viewer/composables/savedViews/management'

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    isUngroupedViewsGroup
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
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
}>()

const isLoading = useMutationLoading()
const createView = useCreateSavedView()
const isSelected = defineModel<boolean>('isSelected')

const open = ref(false)

const isUngroupedGroup = computed(() => props.group.isUngroupedViewsGroup)
const canUpdate = computed(() => props.group.permissions.canUpdate)

const onAddGroupView = async () => {
  await createView({
    groupId: props.group.id
  })
  isSelected.value = true
}

watch(
  () => isSelected.value,
  (isSelected) => {
    if (isSelected) {
      open.value = true
    }
  },
  { immediate: true }
)
</script>
