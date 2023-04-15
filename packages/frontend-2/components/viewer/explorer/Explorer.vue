<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #actions>
        <FormButton
          size="xs"
          text
          :icon-left="BarsArrowDownIcon"
          @click="expandLevel++"
        >
          Unfold
        </FormButton>
        <FormButton
          size="xs"
          text
          :icon-left="BarsArrowUpIcon"
          :disabled="expandLevel <= -1 && manualExpandLevel <= -1"
          @click="collapse()"
        >
          Collapse
        </FormButton>
      </template>
      <div class="relative flex flex-col space-y-2 py-2">
        <div
          v-for="(rootNode, idx) in rootNodes"
          :key="idx"
          class="bg-foundation rounded-lg"
        >
          <ViewerExplorerTreeItem
            :item-id="(rootNode.data?.id as string)"
            :tree-item="markRaw(rootNode)"
            :sub-header="'Model Version'"
            :debug="false"
            :expand-level="expandLevel"
            :manual-expand-level="manualExpandLevel"
            @expanded="(e) => (manualExpandLevel < e ? (manualExpandLevel = e) : '')"
          />
        </div>
      </div>
    </ViewerLayoutPanel>
    <ViewerExplorerFilters :filters="allFilters || []" />
  </div>
</template>
<script setup lang="ts">
import { BarsArrowUpIcon, BarsArrowDownIcon } from '@heroicons/vue/24/solid'
import { ViewerEvent } from '@speckle/viewer'
import { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'

defineEmits(['close'])

const { modelsAndVersionIds } = useInjectedViewerLoadedResources()
const {
  resources: {
    response: { resourceItems }
  }
} = useInjectedViewerState()
// const { instance: viewer } = useInjectedViewer()
const {
  worldTree,
  filters: { all: allFilters }
} = useInjectedViewerInterfaceState()

const expandLevel = ref(-1)
const manualExpandLevel = ref(-1)

const collapse = () => {
  if (expandLevel.value > -1) expandLevel.value--
  if (manualExpandLevel.value > -1) manualExpandLevel.value--
}

const rootNodes = computed(() => {
  if (!worldTree.value) return []
  expandLevel.value = -1
  const _worldTree = worldTree.value
  const nodes = []
  const rootNodes = _worldTree._root.children as ExplorerNode[]
  for (const node of rootNodes) {
    const objectId = ((node.model as Record<string, unknown>).id as string)
      .split('/')
      .reverse()[0] as string
    const resourceItem = resourceItems.value.find((res) => res.objectId === objectId)
    const raw = node.model?.raw as Record<string, unknown>
    if (resourceItem?.modelId) {
      // Model resource
      const model = modelsAndVersionIds.value.find(
        (item) => item.model.id === resourceItem.modelId
      )?.model
      raw.name = model?.name
      raw.type = model?.id
    } else {
      raw.name = 'Object'
      raw.type = 'Single Object'
    }
    nodes.push(node.model as ExplorerNode)
  }
  console.log(nodes)
  return nodes
})
</script>
