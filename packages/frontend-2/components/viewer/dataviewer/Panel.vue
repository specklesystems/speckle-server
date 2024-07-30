<template>
  <div class="px-2 divide-y divide-dashed divide-outline-3">
    <div v-for="obj in rootObjs" :key="obj.referencedId" class="py-3">
      <div class="font-medium text-body-2xs pl-1 mb-2 text-foreground-1">
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
    name: 'Selection',
    // eslint-disable-next-line camelcase
    speckle_type: 'reference'
  }))

  const models = modelsAndVersionIds.value.map((m) => ({
    referencedId: m.model.loadedVersion.items[0].referencedObject,
    name: m.model.name,
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
