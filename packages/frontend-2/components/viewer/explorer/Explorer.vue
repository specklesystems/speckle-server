<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Scene explorer</template>

      <template #actions>
        <div class="flex items-center justify-between w-full">
          <div v-if="!showRaw" class="flex items-center gap-1">
            <FormButton
              size="sm"
              color="primary"
              text
              :icon-left="BarsArrowDownIcon"
              @click="expandLevel++"
            >
              Unfold
            </FormButton>
            <FormButton
              size="sm"
              color="primary"
              text
              :icon-left="BarsArrowUpIcon"
              :disabled="expandLevel <= -1 && manualExpandLevel <= -1"
              @click="collapse()"
            >
              Collapse
            </FormButton>
          </div>
          <div v-else>
            <h4 class="font-medium whitespace-normal text-body-2xs ml-1">Dev mode</h4>
          </div>

          <FormButton
            v-tippy="showRaw ? 'Switch back' : 'Switch to Dev Mode'"
            size="sm"
            class="-mr-1"
            color="subtle"
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
        <div v-for="(rootNode, idx) in rootNodes" :key="idx" class="rounded-xl">
          <ViewerExplorerTreeItem
            :tree-item="rootNode"
            :sub-header="'Model version'"
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
import type {
  ExplorerNode,
  TreeItemComponentModel
} from '~~/lib/viewer/helpers/sceneExplorer'
import {
  useInjectedViewer,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'
import { sortBy, flatten } from 'lodash-es'

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
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  expandLevel.value = -1
  const rootNodes = worldTree.value._root.children as ExplorerNode[]

  const results: Record<number, ExplorerNode[]> = {}
  const unmatchedNodes: ExplorerNode[] = []

  for (const node of rootNodes) {
    const objectId = ((node.model as Record<string, unknown>).id as string)
      .split('/')
      .reverse()[0] as string
    const resourceItemIdx = resourceItems.value.findIndex(
      (res) => res.objectId === objectId
    )
    const resourceItem =
      resourceItemIdx !== -1 ? resourceItems.value[resourceItemIdx] : null

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
      raw.type = 'Single object'
    }

    const res = node.model as ExplorerNode
    if (resourceItem) {
      ;(results[resourceItemIdx] = results[resourceItemIdx] || []).push(res)
    } else {
      unmatchedNodes.push(res)
    }
  }

  const nodes = [
    ...flatten(sortBy(Object.entries(results), (i) => i[0]).map((i) => i[1])),
    ...unmatchedNodes
  ]

  return nodes.map(
    (n): TreeItemComponentModel => ({
      rawNode: markRaw(n)
    })
  )
})
</script>
