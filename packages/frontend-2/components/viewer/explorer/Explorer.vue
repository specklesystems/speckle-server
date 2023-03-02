<template>
  <div class="">
    <div class="flex flex-col space-y-2">
      <div
        v-for="(rootNode, idx) in rootNodes"
        :key="idx"
        class="bg-foundation rounded-lg shadow"
      >
        <ViewerExplorerTreeItemOption3
          :item-id="(rootNode.data?.id as string)"
          :tree-item="markRaw(rootNode)"
          :sub-header="'Model Version'"
          :debug="false"
          force-unfold
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ViewerEvent } from '@speckle/viewer'
import { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import {
  useInjectedViewer,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
const { modelsAndVersionIds } = useInjectedViewerLoadedResources()
const {
  resources: {
    response: { resourceItems }
  }
} = useInjectedViewerState()
const { instance: viewer } = useInjectedViewer()

let realTree = viewer.getWorldTree()

const refHack = ref(1)
onMounted(() => {
  viewer.on(ViewerEvent.Busy, (isBusy) => {
    if (isBusy) return
    console.log('should get new tree')
    realTree = viewer.getWorldTree()
    refHack.value++
  })
})

const rootNodes = computed(() => {
  refHack.value
  console.log('should update rootNodes')
  const nodes = []
  const rootNodes = realTree._root.children as ExplorerNode[]
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
  return nodes
})
</script>
