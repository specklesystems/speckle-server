<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="flex justify-between flex-col bg-foundation rounded-md shadow py-2">
    <div class="flex flex-col space-y-1">
      <ViewerExplorerTreeItemOption3
        v-for="(rootNode, idx) in rootNodes"
        :key="idx"
        :item-id="(rootNode.data?.id as string)"
        :tree-item="markRaw(rootNode)"
        :debug="true"
        force-unfold
      />
    </div>
  </div>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] px-[2px] right-4 rounded-md mb-4 transition-[width,opacity] ease-in-out duration-75 bg-foundation p-2 text-tiny overflow-y-auto simple-scrollbar ${
      true ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <pre>{{ selectedObject }}</pre>
  </div>
</template>
<script setup lang="ts">
// Some questions:
// - no idea how to ts-ify this (note: the tree lib is ts)

// TODOs:
// - handle grasshopper models
// - test sketchup, blender, etc. models
// - ask alex re viewer data tree types exporting

import { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
import { useInjectLoadedViewerResources } from '~~/lib/viewer/composables/viewer'
import { DataTree, ViewerEvent } from '@speckle/viewer'

const { viewer } = useInjectedViewer()
const { resourceItems, modelsAndVersionIds } = useInjectLoadedViewerResources()

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const rootNodes = realTree._root.children as ExplorerNode[]
  for (const node of rootNodes) {
    const objectId = node.model.id.split('/').reverse()[0]
    const resourceItem = resourceItems.value.find((res) => res.objectId === objectId)
    if (resourceItem?.modelId) {
      // Model resource
      const model = modelsAndVersionIds.value.find(
        (item) => item.model.id === resourceItem.modelId
      )?.model
      node.model.raw.name = model?.name
      node.model.raw.type = model?.id
    } else {
      node.model.raw.name = 'Object'
      node.model.raw.type = 'Single Object'
    }
    nodes.push(node.model)
  }
  return nodes
})

const selectedObject = ref({})
provide('selectedObject', selectedObject)
</script>
