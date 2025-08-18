<template>
  <ViewerLayoutSidePanel @close="$emit('close')">
    <template #title>
      <div class="flex justify-between items-center">
        <div>Views</div>
      </div>
    </template>
    <template #actions>
      <div class="flex">
        <FormButton size="sm" color="subtle" :icon-left="Search" hide-text />
        <div v-tippy="canCreateViewOrGroup?.errorMessage">
          <FormButton
            size="sm"
            color="subtle"
            :icon-left="FolderPlus"
            hide-text
            name="addGroup"
            :disabled="!canCreateViewOrGroup?.authorized || isLoading"
            @click="onAddGroup"
          />
        </div>
        <div v-tippy="canCreateViewOrGroup?.errorMessage">
          <FormButton
            size="sm"
            color="subtle"
            :icon-left="Plus"
            hide-text
            name="addView"
            :disabled="!canCreateViewOrGroup?.authorized || isLoading"
            @click="onAddView"
          />
        </div>
      </div>
    </template>
    <div class="border-b border-outline-2 px-4 py-2">
      <ViewerButtonGroup>
        <ViewerButtonGroupButton
          v-for="viewsType in Object.values(ViewsType)"
          :key="viewsType"
          :is-active="selectedViewsType === viewsType"
          class="grow"
          @click="() => (selectedViewsType = viewsType)"
        >
          <span class="text-body-2xs text-foreground px-2 py-1">
            {{ viewsTypeLabels[viewsType] }}
          </span>
        </ViewerButtonGroupButton>
      </ViewerButtonGroup>
    </div>
    <div class="text-body-sm">
      <ViewerSavedViewsPanelGroups
        v-model:selected-group-id="selectedGroupId"
        :views-type="selectedViewsType"
      />
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { Search, FolderPlus, Plus } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import { SavedViewVisibility } from '~/lib/common/generated/gql/graphql'
import {
  useCreateSavedView,
  useCreateSavedViewGroup
} from '~/lib/viewer/composables/savedViews/management'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { ViewsType, viewsTypeLabels } from '~/lib/viewer/helpers/savedViews'

graphql(`
  fragment ViewerSavedViewsPanel_Project on Project {
    id
    permissions {
      canCreateSavedView {
        ...FullPermissionCheckResult
      }
    }
  }
`)

defineEmits<{
  close: []
}>()

const {
  projectId,
  resources: {
    request: { resourceIdString },
    response: { project }
  }
} = useInjectedViewerState()
const createGroup = useCreateSavedViewGroup()
const createSavedView = useCreateSavedView()
const isLoading = useMutationLoading()

const selectedViewsType = ref<ViewsType>(ViewsType.Personal)
const selectedGroupId = ref<string | null>(null)

const canCreateViewOrGroup = computed(
  () => project.value?.permissions.canCreateSavedView
)

const onAddView = async () => {
  if (isLoading.value) return
  const view = await createSavedView({
    visibility:
      selectedViewsType.value === ViewsType.Shared
        ? SavedViewVisibility.Public
        : undefined
  })
  if (view) {
    // Auto-open the group that the view created to
    selectedGroupId.value = view.group.id
  }
}

const onAddGroup = async () => {
  if (isLoading.value) return
  const group = await createGroup({
    projectId: projectId.value,
    resourceIdString: resourceIdString.value
  })
  if (group) {
    // Auto-open the group
    selectedGroupId.value = group.id
  }
}
</script>
