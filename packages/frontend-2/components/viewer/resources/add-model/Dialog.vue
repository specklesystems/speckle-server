<template>
  <LayoutDialog v-model:open="open" max-width="lg">
    <template #header>Add Model</template>
    <div class="flex flex-col gap-y-4">
      <LayoutTabs v-slot="{ activeItem }" :items="tabItems">
        <ViewerResourcesAddModelDialogModelTab
          v-if="activeItem.id === 'model'"
          @chosen="onModelChosen"
        />
        <ViewerResourcesAddModelDialogObjectTab v-else @chosen="onObjectsChosen" />
      </LayoutTabs>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { LayoutTabItem } from '~~/lib/layout/helpers/components'
import { useInjectedViewerRequestedResources } from '~~/lib/viewer/composables/setup'

const { items } = useInjectedViewerRequestedResources()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const tabItems = ref<LayoutTabItem[]>([
  { title: 'By model', id: 'model' },
  { title: 'By object URL', id: 'object' }
])

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const mp = useMixpanel()

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

  open.value = false
}
</script>
