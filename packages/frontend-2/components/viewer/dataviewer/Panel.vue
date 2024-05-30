<template>
  <div class="px-2 divide-y divide-dashed divide-primary-muted">
    <div v-for="obj in rootObjs" :key="obj.referencedId" class="py-2">
      <div class="font-bold text-xs pl-1 mb-2 text-foreground-2">
        {{ obj.name }}
      </div>
      <ViewerDataviewerObject :object="obj" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSelectionUtilities } from '~/lib/viewer/composables/ui'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

const { modelsAndVersionIds, objects } = useInjectedViewerLoadedResources()

const { objects: selectedObjects } = useSelectionUtilities()

const rootObjs = computed(() => {
  const selection = selectedObjects.value.map((o) => ({
    referencedId: o.id,
    name: 'Selected object ' + o.id,
    // eslint-disable-next-line camelcase
    speckle_type: 'reference'
  }))

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

  return [...selection, ...models, ...objs]
})
</script>
