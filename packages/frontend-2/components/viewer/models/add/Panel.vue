<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <FormButton
        :icon-left="ChevronLeftIcon"
        color="subtle"
        class="-ml-3"
        @click="$emit('close')"
      >
        Exit add model
      </FormButton>
    </template>

    <div class="flex flex-col gap-y-4 h-full px-4 py-3">
      <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
        <template #default="{ activeItem }">
          <ViewerModelsAddModelTab
            v-if="activeItem.id === 'model'"
            @chosen="onModelChosen"
          />
          <ViewerModelsAddObjectTab
            v-else-if="activeItem.id === 'object'"
            @chosen="onObjectsChosen"
          />
        </template>
      </LayoutTabsHorizontal>
    </div>
  </ViewerLayoutSidePanel>
</template>

<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { LayoutTabItem } from '~~/lib/layout/helpers/components'
import { useInjectedViewerRequestedResources } from '~~/lib/viewer/composables/setup'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'

const emit = defineEmits(['close'])

const { items } = useInjectedViewerRequestedResources()
const { zoom } = useCameraUtilities()
const { triggerNotification } = useGlobalToast()

const tabItems = ref<LayoutTabItem[]>([
  { title: 'By model', id: 'model' },
  { title: 'By object URL', id: 'object' }
])

const activeTab = ref(tabItems.value[0])

const mp = useMixpanel()

const triggerZoomNotification = () => {
  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Model added successfully',
    cta: {
      title: 'Zoom to fit',
      onClick: () => {
        zoom()
      }
    }
  })
}

const onModelChosen = async (params: { modelId: string }) => {
  const { modelId } = params
  await items.update([
    ...items.value,
    ...SpeckleViewer.ViewerRoute.resourceBuilder().addModel(modelId).toResources()
  ])

  mp.track('Viewer Action', {
    type: 'action',
    name: 'federation',
    action: 'add',
    resource: 'model'
  })

  triggerZoomNotification()

  emit('close')
}

const onObjectsChosen = async (params: { objectIds: string[] }) => {
  const { objectIds } = params

  const resourcesApi = SpeckleViewer.ViewerRoute.resourceBuilder()
  for (const oid of objectIds) {
    resourcesApi.addObject(oid)
  }

  await items.update([...items.value, ...resourcesApi.toResources()])

  mp.track('Viewer Action', {
    type: 'action',
    name: 'federation',
    action: 'add',
    resource: 'object'
  })

  triggerZoomNotification()

  emit('close')
}
</script>
