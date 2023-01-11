<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="flex justify-between flex-col bg-foundation rounded-md shadow">
    <div class="text-sm font-bold text-foreground-2">Explorer TODO</div>
    <div class="flex flex-col space-y-1">
      <ViewerExplorerTreeItemOption2
        v-for="(rootNode, idx) in rootNodes"
        :key="idx"
        :item-id="rootNode.model.data.id"
        :tree-item="rootNode.model"
        debug
      />
      <div
        class="bg-foundation rounded-md shadow-lg mt-4 sticky bottom-0 h-44 simple-scrollbar overflow-y-auto overflow-x-clip"
      >
        <b>Selected object</b>
        <pre class="text-xs"> {{ cleanSelectedObject }}</pre>
      </div>
    </div>
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

import { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
const { viewer } = useInjectedViewer()

const tree = viewer.getDataTree() // note expensive call, we should keep it alive
provide('dataTree', tree)

const rootNodes = computed(() => tree.root.children) // TODO: match model names

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
