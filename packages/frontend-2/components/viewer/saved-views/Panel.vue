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
      <div class="inline-block">
        <FormSelectBase
          v-model="selectedViewsType"
          mount-menu-on-body
          label="Views Type"
          name="viewsType"
          button-style="simple"
          :menu-max-width="150"
          menu-open-direction="right"
          :allow-unset="false"
          :items="viewsTypeItems"
        >
          <template #nothing-selected>Views Type</template>
          <template #option="{ item }">
            <span>{{ viewsTypeLabels[item] }}</span>
          </template>
          <template #something-selected="{ value }">
            <span v-if="!isArray(value)" class="flex items-center gap-2">
              {{ viewsTypeLabels[value] }}
            </span>
          </template>
        </FormSelectBase>
      </div>
    </div>
    <div class="text-body-sm">
      <ViewerSavedViewsPanelConnectorViews
        v-if="selectedViewsType === ViewsType.Connector"
      />
      <ViewerSavedViewsPanelViews
        v-else
        v-model:selected-group-id="selectedGroupId"
        :views-type="selectedViewsType"
      />
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { isArray } from 'lodash-es'
import { Search, FolderPlus, Plus } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import {
  useCreateSavedView,
  useCreateSavedViewGroup
} from '~/lib/viewer/composables/savedViews/management'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { ViewerEventBusKeys } from '~/lib/viewer/helpers/eventBus'
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
const eventBus = useEventBus()

eventBus.on(ViewerEventBusKeys.SelectSavedViewGroup, ({ groupId }) => {
  selectedGroupId.value = groupId
})

const selectedViewsType = ref<ViewsType>(ViewsType.All)
const selectedGroupId = ref<string | null>(null)

const viewsTypeItems = computed((): ViewsType[] => [
  ViewsType.All,
  ViewsType.My,
  ViewsType.Connector
])
const canCreateViewOrGroup = computed(
  () => project.value?.permissions.canCreateSavedView
)

const onAddView = async () => {
  if (isLoading.value) return
  const view = await createSavedView({})
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
