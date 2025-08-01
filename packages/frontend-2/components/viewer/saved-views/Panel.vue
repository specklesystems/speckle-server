<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #title>
      <div class="flex justify-between items-center">
        <div>Views</div>
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
      </div>
    </template>
    <template #actions>
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
    </template>
    <div class="text-body-sm">
      <ViewerSavedViewsPanelConnectorViews
        v-if="selectedViewsType === ViewsType.Connector"
      />
      <ViewerSavedViewsPanelViews v-else :views-type="selectedViewsType" />
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { isArray } from 'lodash-es'
import { Search, FolderPlus, Plus } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import { useCreateSavedView } from '~/lib/viewer/composables/savedViews/management'
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
  resources: {
    response: { project }
  }
} = useInjectedViewerState()
const createSavedView = useCreateSavedView()
const isLoading = useMutationLoading()

const selectedViewsType = ref<ViewsType>(ViewsType.All)

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
  await createSavedView({})
}
</script>
