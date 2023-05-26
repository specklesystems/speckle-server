<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
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
        :color="showRemove ? 'default' : 'secondary'"
        :icon-left="showRemove ? CheckIcon : MinusIcon"
        :disabled="modelsAndVersionIds.length <= 1"
        @click="showRemove = !showRemove"
      >
        {{ showRemove ? 'Done' : 'Remove' }}
      </FormButton>
    </template>
    <div class="flex flex-col space-y-2 px-1 py-2">
      <template v-if="resourceItems.length">
        <div
          v-for="({ model, versionId }, index) in modelsAndVersionIds"
          :key="model.id"
        >
          <ViewerResourcesModelCard
            :model="model"
            :version-id="versionId"
            :last="index === modelsAndVersionIds.length - 1"
            :show-remove="showRemove"
          />
        </div>
      </template>
    </div>
    <ViewerResourcesAddModelDialog v-model:open="open" />
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'
import { PlusIcon, CheckIcon, MinusIcon } from '@heroicons/vue/24/solid'

defineEmits(['close'])

const showRemove = ref(false)
const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()

const open = ref(false)

watch(modelsAndVersionIds, (newVal) => {
  if (newVal.length <= 1) showRemove.value = false
})
</script>
