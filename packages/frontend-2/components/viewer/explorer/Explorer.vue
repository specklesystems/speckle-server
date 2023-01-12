<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="flex justify-between flex-col bg-foundation rounded-md shadow py-2">
    <!-- <div class="font-bold text-lg pl-3">Scene Tree</div> -->
    <div class="flex flex-col space-y-1">
      <ViewerExplorerTreeItemOption2
        v-for="(rootNode, idx) in rootNodes"
        :key="idx"
        :item-id="(rootNode.data?.id as string)"
        :tree-item="markRaw(rootNode)"
        :header="nodeNames[idx].header"
        :sub-header="nodeNames[idx].subHeader"
        xxxdebug
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
// - will need to be "refreshed" when versions are changed
// - keep this dude alive?
// - no idea how to ts-ify this (note: the tree lib is ts)

// TODOs:
// - handle grasshopper models
// - test sketchup, blender, etc. models
// - ask alex re viewer data tree types exporting

import { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
import { useInjectLoadedViewerResources } from '~~/lib/viewer/composables/viewer'

const { viewer } = useInjectedViewer()

const { resourceItems, modelsAndVersionIds } = useInjectLoadedViewerResources()

const tree = shallowRef(viewer.getDataTree()) // note expensive call
// const needsRefresh = ref(false)

watch(resourceItems, (newVal, oldVal) => {
  console.log('need to refresh the tree')
  tree.value = viewer.getDataTree()
})

const rootNodes = computed(() => {
  return (
    (tree.value as unknown as Record<string, unknown>).root as ExplorerNode
  ).children.map(
    (child) => markRaw(child as unknown as Record<string, unknown>).model
  ) as ExplorerNode[]
})

const nodeNames = computed(() => {
  const nodeNames = []
  for (const rootNode of rootNodes.value) {
    const objectId = rootNode.guid?.split('/').reverse()[0]
    const resourceItem = resourceItems.value.find((res) => res.objectId === objectId)
    if (resourceItem?.modelId) {
      // Model resource
      const model = modelsAndVersionIds.value.find(
        (item) => item.model.id === resourceItem.modelId
      )?.model
      nodeNames.push({
        header: `Model: ${model?.name as string}`,
        subHeader: model?.id
      })
    } else {
      // Object resource
      nodeNames.push({ header: 'Object', subHeader: objectId })
    }
  }
  return nodeNames
})

const selectedObject = ref({})
provide('selectedObject', selectedObject)

const cleanSelectedObject = computed(() => {
  if (!selectedObject.value) return null
  const copy = JSON.parse(JSON.stringify(selectedObject.value)) as Record<
    string,
    unknown
  >
  delete copy.__closure
  return copy
})
</script>
