<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="p-2 flex justify-between flex-col">
    <div class="text-sm font-bold text-foreground-2">Explorer TODO</div>
    <div class="flex flex-col space-y-1">
      <ViewerExplorerTreeItem
        v-for="(rootNode, idx) in rootNodes"
        :key="idx"
        :item="rootNode.model.data"
      />
    </div>
  </div>
</template>
<script setup>
// Some questions:
// - will need to be "refreshed" when versions are changed
// - keep this dude alive?
// - no idea how to ts-ify this (note: the tree lib is ts)

import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
const { viewer } = useInjectedViewer()

const tree = viewer.getDataTree()
console.log(tree.root.children[0].model.data)

const rootNodes = computed(() => tree.root.children) // TODO: match model names
</script>
