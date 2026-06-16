<template>
  <div
    class="absolute top-0 left-0 w-full h-full flex justify-center items-end pb-16 pointer-events-none"
  >
    <div
      v-if="viewerStore.loadedViewerId === props.id"
      class="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto"
    >
      <FormButton color="outline" size="sm" @click="viewerMode = !viewerMode">
        {{ viewerMode ? 'Switch to draw mode' : 'Switch to viewer mode' }}
      </FormButton>
    </div>

    <!-- Viewer related actions -->
    <div class="flex flex-col gap-y-2 w-full max-w-max pointer-events-auto">
      <ToolbarStylePopover
        v-model:show-thickness="showThickness"
        v-model:show-line-type="showLineType"
        v-model:brush-size="store.brushSize"
        v-model:selected-line-type="selectedLineType"
      />

      <div class="flex gap-x-2 p-1 rounded-lg border border-outline-2 bg-foundation">
        <template v-if="paper?.mode === 'infinite'">
          <div class="flex gap-x-0.5">
            <FormButton
              v-tippy="'Load model from Speckle'"
              :color="store.currentTool === 'viewer' ? 'primary' : 'outline'"
              :icon-left="Download"
              hide-text
              @click="store.setTool('viewer')"
            >
              Add 3D viewer model
            </FormButton>
          </div>
          <div class="w-px bg-outline-3" />
        </template>

        <!-- Styling actions -->
        <ToolbarStyleControls
          :current-color="store.currentStrokeColor"
          :brush-size="store.brushSize"
          v-model:show-thickness="showThickness"
          v-model:show-line-type="showLineType"
          :selected-line-type="selectedLineType"
          @color-change="updateSelectedColors"
        />

        <div class="w-px bg-highlight-1" />

        <!-- Shape actions -->
        <ToolbarDrawingTools
          :current-tool="store.currentTool"
          @tool-change="store.setTool"
          @clear-all="clearAllShapes"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { useCanvasStore } from '../../stores/canvas'
import { useViewerStore } from '../../stores/sharedViewer'
import { storeToRefs } from 'pinia'
import ToolbarStylePopover from './toolbar/StylePopover.vue'
import ToolbarStyleControls from './toolbar/StyleControls.vue'
import ToolbarDrawingTools from './toolbar/DrawingTools.vue'

const props = defineProps<{
  id: string
}>()

const store = useCanvasStore()
const viewerStore = useViewerStore()
const { showThickness, showLineType, selectedLineType, viewerMode } = storeToRefs(store)

const paper = computed(() => store.getActivePaper())

const updateSelectedColors = (stroke?: string) => {
  if (!stroke) return
  store.selectedIds.forEach((id) => {
    const paper = store.getActivePaper()
    if (!paper) return
    const viewerContainer = paper.viewerContainers[0]
    if (!viewerContainer) return
    store.updateShape(paper.id, viewerContainer.id, id, {
      strokeColor: stroke
    })
  })
}

const clearAllShapes = () => {
  const paper = store.getActivePaper()
  if (!paper) return
  const viewerContainer = paper.viewerContainers[0]
  if (!viewerContainer) return
  store.clearShapes(paper.id, viewerContainer.id)
}
</script>
