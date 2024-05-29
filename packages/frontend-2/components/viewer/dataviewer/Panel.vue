<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>
      <span class="text-foreground">Raw Data Viewer</span>
    </template>
    <div class="px-1 divide-y divide-dashed divide-primary-muted">
      <div v-for="obj in rootObjs" :key="obj.referencedId" class="py-2">
        <div class="font-bold text-xs pl-1 mb-2 text-foreground-2">
          {{ obj.name }}
        </div>
        <ViewerDataviewerObject :object="obj" />
      </div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ViewerEvent } from '@speckle/viewer'
import { useViewerEventListener } from '~/lib/viewer/composables/viewer'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()

defineEmits<{
  (e: 'close'): void
}>()

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
if (process.client) {
  window.t = modelsAndVersionIds.value // TODO: remove
  watch(modelsAndVersionIds, () => (window.t = modelsAndVersionIds.value))
}

const refhack = ref(1)

useViewerEventListener(ViewerEvent.Busy, (isBusy: boolean) => {
  if (isBusy) return
  refhack.value++
})

const rootObjs = computed(() => {
  const models = modelsAndVersionIds.value.map((m) => ({
    referencedId: m.model.loadedVersion.items[0].referencedObject,
    name: 'Model ' + m.model.name,
    // eslint-disable-next-line camelcase
    speckle_type: 'reference'
  }))

  const objs = objects.value.map((m) => ({
    referencedId: m.objectId,
    name: 'Object ' + m.objectId,
    // eslint-disable-next-line camelcase
    speckle_type: 'reference'
  }))

  return [...models, ...objs]
})
</script>
