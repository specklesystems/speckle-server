<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Scene Explorer</template>

      <template #actions>
        <div class="flex items-center justify-between w-full">
          <div v-if="!showRaw" class="flex items-center">
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
          </div>
          <div v-else>
            <h4 class="font-bold whitespace-normal text-xs ml-1">Dev Mode</h4>
          </div>

          <FormButton
            v-tippy="showRaw ? 'Switch back' : 'Switch to Dev Mode'"
            size="xs"
            text
            class="-mr-0.5 sm:-mr-1"
            color="secondary"
            @click="showRaw = !showRaw"
          >
            <CodeBracketIcon
              class="size-4 sm:size-3"
              :class="showRaw ? 'text-primary' : 'text-foreground'"
            />
          </FormButton>
        </div>
      </template>
      <div
        v-if="!showRaw && rootNodes.length !== 0"
        class="relative flex flex-col gap-y-2 py-2"
      >
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
      <ViewerDataviewerPanel v-if="showRaw" class="pointer-events-auto" />
    </ViewerLayoutPanel>
    <ViewerExplorerFilters :filters="allFilters || []" />
  </div>
</template>
<script setup lang="ts">
import {
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/solid'
import { ViewerEvent } from '@speckle/viewer'
import type { ExplorerNode } from '~~/lib/common/helpers/sceneExplorer'
import {
  useInjectedViewer,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { markRaw } from 'vue'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'

defineEmits(['close'])

const { modelsAndVersionIds } = useInjectedViewerLoadedResources()
const {
  resources: {
    response: { resourceItems }
  }
} = useInjectedViewerState()
const {
  metadata: { worldTree, availableFilters: allFilters }
} = useInjectedViewer()

const expandLevel = ref(-1)
const manualExpandLevel = ref(-1)

const collapse = () => {
  if (expandLevel.value > -1) expandLevel.value--
  if (manualExpandLevel.value > -1) manualExpandLevel.value--
}

const showRaw = ref(false)

// TODO: worldTree being set in postSetup.ts (viewer) does not seem to create a reactive effect
// in here (as i was expecting it to?). Therefore, refHack++ to trigger the computed prop rootNodes.
// Possibly Fabs will know more :)
const refhack = ref(1)
useViewerEventListener(ViewerEvent.Busy, (isBusy: boolean) => {
  if (isBusy) return
  refhack.value++
})

const rootNodes = computed(() => {
  refhack.value

  if (!worldTree.value) return []
  expandLevel.value = -1
  const nodes = []
  const rootNodes = worldTree.value._root.children as ExplorerNode[]
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
