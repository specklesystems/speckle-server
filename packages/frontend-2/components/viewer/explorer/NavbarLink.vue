<template>
  <div class="truncate">
    <HeaderNavLink
      v-if="lastBreadcrumbName"
      :to="route.fullPath"
      :name="lastBreadcrumbName"
    ></HeaderNavLink>
  </div>
</template>
<script setup lang="ts">
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

const route = useRoute()
const { modelsAndVersionIds: loadedModels, objects: loadedObjects } =
  useInjectedViewerLoadedResources()

const lastBreadcrumbName = computed(() => {
  if (!loadedModels.value?.length && !loadedObjects.value?.length) return null
  const totalLen = loadedModels.value.length + loadedObjects.value.length
  const hasObjects = loadedObjects.value.length !== 0
  const hasModels = loadedModels.value.length !== 0
  const isMixed = hasObjects && hasModels
  if (totalLen > 1) return `Multiple ${isMixed ? 'resources' : 'models'}`

  if (hasObjects) return `Object ${loadedObjects.value[0].objectId.substring(0, 3)}...`
  return loadedModels.value[0].model.name
})
</script>
