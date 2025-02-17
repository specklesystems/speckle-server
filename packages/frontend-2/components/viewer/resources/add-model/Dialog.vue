<template>
  <LayoutDialog v-model:open="open" max-width="md">
    <template #header>Add model</template>
    <div class="flex flex-col gap-y-4">
      <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
        <template #default="{ activeItem }">
          <ViewerResourcesAddModelDialogModelTab
            v-if="activeItem.id === 'model'"
            @chosen="onModelChosen"
          />
          <ViewerResourcesAddModelDialogObjectTab
            v-else-if="activeItem.id === 'object'"
            @chosen="onObjectsChosen"
          />
        </template>
      </LayoutTabsHorizontal>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { LayoutTabItem } from '~~/lib/layout/helpers/components'
import { useInjectedViewerRequestedResources } from '~~/lib/viewer/composables/setup'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { items } = useInjectedViewerRequestedResources()
const { zoom } = useCameraUtilities()
const { triggerNotification } = useGlobalToast()

const tabItems = ref<LayoutTabItem[]>([
  { title: 'By model', id: 'model' },
  { title: 'By object URL', id: 'object' }
])

const activeTab = ref(tabItems.value[0])

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

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

  open.value = false
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

  open.value = false
}
</script>
