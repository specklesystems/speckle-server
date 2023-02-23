<template>
  <LayoutDialog v-model:open="open">
    <div class="flex flex-col space-y-4">
      <div class="h4 font-bold text-foreground">Add model</div>
      <LayoutTabs v-slot="{ activeItem }" :items="tabItems">
        <ViewerResourcesAddModelDialogModelTab
          v-if="activeItem.id === 'model'"
          @chosen="onModelChosen"
        />
        <ViewerResourcesAddModelDialogObjectTab v-else />
      </LayoutTabs>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import { LayoutTabItem } from '~~/lib/layout/helpers/components'
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

const onModelChosen = (params: { modelId: string }) => {
  const { modelId } = params
  items.value = [
    ...items.value,
    ...SpeckleViewer.ViewerRoute.resourceBuilder().addModel(modelId).toResources()
  ]
  open.value = false
}
</script>
