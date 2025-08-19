<template>
  <ViewerLayoutSidePanel disable-scrollbar class="relative" @close="$emit('close')">
    <template #title>
      <div class="flex justify-between items-center">
        <div>Views</div>
      </div>
    </template>
    <template #actions>
      <div v-if="!isLowerPlan" class="flex items-center">
        <FormButton
          v-if="false"
          size="sm"
          color="subtle"
          :icon-left="Search"
          hide-text
        />
        <div v-tippy="canCreateViewOrGroup?.errorMessage" class="flex items-center">
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
        <div v-tippy="canCreateViewOrGroup?.errorMessage" class="flex items-center">
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
    <template v-if="!isLowerPlan">
      <div class="px-4 pt-2">
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
      <div class="text-body-sm flex-1 min-h-0 overflow-y-auto simple-scrollbar">
        <ViewerSavedViewsPanelGroups
          v-model:selected-group-id="selectedGroupId"
          :views-type="selectedViewsType"
        />
      </div>
      <div
        v-if="isViewerSeat && !hideViewerSeatDisclaimer"
        class="absolute bottom-0 left-0 right-0 p-2"
      >
        <CommonPromoAlert
          title="Save your views"
          text="With an editor seat, unlock the option to save your own views."
          :button="{ title: 'Learn more' }"
          show-closer
          @close="hideViewerSeatDisclaimer = true"
        />
      </div>
    </template>
    <ViewerSavedViewsPlanUpsell v-else />
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { Search, FolderPlus, Plus } from 'lucide-vue-next'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import {
  SavedViewVisibility,
  WorkspaceSeatType
} from '~/lib/common/generated/gql/graphql'
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
    workspace {
      id
      seatType
      planSupportsSavedViews: hasAccessToFeature(featureName: savedViews)
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
const hideViewerSeatDisclaimer = useSynchronizedCookie<boolean>(
  'hideViewerSeatSavedViewsDisclaimer',
  {
    default: () => false
  }
)

const canCreateViewOrGroup = computed(
  () => project.value?.permissions.canCreateSavedView
)
const isViewerSeat = computed(
  () => project.value?.workspace?.seatType === WorkspaceSeatType.Viewer
)
const isLowerPlan = computed(() => !project.value?.workspace?.planSupportsSavedViews)

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
