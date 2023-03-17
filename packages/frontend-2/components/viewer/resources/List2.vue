<template>
  <div>
    <div
      class="bg-foundation rounded-lg shadow flex flex-col space-y-1 xxxoverflow-hidden"
    >
      <div
        class="flex items-center sticky top-0 px-2 h-10 bg-foundation-2 shadow-md rounded-t-lg justify-between z-30"
      >
        <div>
          <FormButton
            size="xs"
            text
            :icon-left="PlusIcon"
            :disabled="showRemove"
            @click="open = true"
          >
            Add
          </FormButton>
          <FormButton
            size="xs"
            text
            :color="showRemove ? 'primary' : 'secondary'"
            :icon-left="showRemove ? CheckIcon : MinusIcon"
            :disabled="modelsAndVersionIds.length <= 1"
            @click="showRemove = !showRemove"
          >
            {{ showRemove ? 'Done' : 'Remove' }}
          </FormButton>
        </div>
      </div>
      <div class="flex flex-col px-1 py-2 space-y-2">
        <template v-if="resourceItems.length">
          <div
            v-for="({ model, versionId }, index) in modelsAndVersionIds"
            :key="model.id"
          >
            <ViewerResourcesModelCard3
              :model="model"
              :version-id="versionId"
              :last="index === modelsAndVersionIds.length - 1"
              :show-remove="showRemove"
              @remove="removeResource"
            />
          </div>
        </template>
      </div>
    </div>
    <ViewerResourcesAddModelDialog v-model:open="open" />
  </div>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { PlusIcon, CheckIcon, MinusIcon } from '@heroicons/vue/24/solid'
import { Get } from 'type-fest'
import { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const showRemove = ref(false)
const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()

const { items } = useInjectedViewerRequestedResources()

const open = ref(false)

const removeResource = (id: string) => {
  const remaining = items.value.filter((x) => {
    if (x.type === SpeckleViewer.ViewerRoute.ViewerResourceType.Model)
      return (x as SpeckleViewer.ViewerRoute.ViewerModelResource).modelId !== id
    else if (x.type === SpeckleViewer.ViewerRoute.ViewerResourceType.Object)
      return (x as SpeckleViewer.ViewerRoute.ViewerObjectResource).objectId !== id
    else return true
  })

  items.value = [...remaining]
}

watch(modelsAndVersionIds, (newVal) => {
  if (newVal.length <= 1) showRemove.value = false
})
</script>
