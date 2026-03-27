<template>
  <div v-if="paper?.mode === 'infinite'">
    <ViewerContainer
      v-for="c in paper?.viewerContainers"
      :key="c.id"
      :viewer-container="c"
      :canvas-transform="canvasTransform"
      @fit-viewer-container-to-screen="() => fitViewerContainerToScreen(c)"
    />
  </div>

  <div class="absolute inset-0" :class="store.cursorType">
    <v-stage
      ref="stage"
      class="absolute inset-0"
      :config="{ width: stageWidth, height: stageHeight }"
      @wheel="onWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="onStageClick"
    >
      <CanvasPaperStaticLayer
        :id="paperId"
        :shapes="shapes"
        :transform="canvasTransform"
      />
      <v-layer>
        <v-group :config="canvasTransform">
          <CanvasViewerContainer
            v-for="c in paper?.viewerContainers"
            :key="c.adaptiveContainer.id"
            :container="c.adaptiveContainer"
            :x="c.x"
            :y="c.y"
            :canvas-transform="canvasTransform"
            @resize="(payload) => resizeViewerContainer(c.id, payload)"
          />
        </v-group>
      </v-layer>
      <v-layer>
        <!-- Group of utility shapes -->
        <v-group :config="canvasTransform">
          <v-rect
            v-if="isPolylineClosable"
            :config="{
              x: polylineDrawingPositionX - 8,
              y: polylineDrawingPositionY - 8,
              width: 16,
              height: 16,
              stroke: 'red',
              strokeScaleEnabled: false,
              fill: 'rgba(0,0,255,0.1)',
              listening: false
            }"
          />

          <v-rect
            v-if="marquee.visible"
            :config="{
              x: marquee.x,
              y: marquee.y,
              width: marquee.width,
              height: marquee.height,
              stroke: 'blue',
              strokeScaleEnabled: false,
              dash: [4, 4],
              fill: 'rgba(0,0,255,0.1)',
              listening: false
            }"
          />

          <v-line
            v-if="liveShape && liveShape.type === 'text' && showCaret"
            :config="{
              points: [
                liveShape.x + caretPos.x,
                liveShape.y + caretPos.y,
                liveShape.x + caretPos.x,
                liveShape.y + caretPos.y + 30
              ],
              stroke: '#000000',
              strokeWidth: 2,
              listening: false
            }"
          />

          <v-rect
            v-if="liveShape && liveShape.type === 'text'"
            :config="{
              x: liveShape.x - 2,
              y: liveShape.y - 2,
              width: dimensions.width + 4,
              height: dimensions.height + 4,
              stroke: '#007AFF',
              strokeWidth: 1,
              listening: false
            }"
          />
        </v-group>
      </v-layer>

      <v-layer ref="liveLayer" class="z-50">
        <v-group :config="canvasTransform">
          <v-line
            v-if="liveShape && liveShape.type === 'freehand'"
            :config="{
              points: liveShape.points,
              fill: liveShape.strokeColor,
              stroke: liveShape.strokeColor,
              strokeWidth: liveShape.strokeWidth,
              closed: true,
              lineCap: 'round',
              lineJoin: 'round',
              tension: 0
            }"
          />

          <v-arrow
            v-else-if="liveShape && liveShape.type === 'arrow'"
            :config="{
              points: liveShape.points,
              stroke: liveShape.strokeColor,
              fill: liveShape.strokeColor,
              strokeWidth: liveShape.strokeWidth,
              pointerLength: 20,
              pointerWidth: 20
            }"
          />

          <v-line
            v-else-if="liveShape && liveShape.type === 'polyline'"
            :config="{
              points: liveShape.points,
              stroke: liveShape.strokeColor,
              strokeWidth: liveShape.strokeWidth,
              fill: 'transparent',
              lineCap: 'round',
              lineJoin: 'round',
              dash: selectedLineType?.values
            }"
          />

          <v-text
            v-else-if="liveShape && liveShape.type === 'text'"
            :config="{
              x: liveShape.x,
              y: liveShape.y,
              fill: liveShape.fillColor,
              text: liveShape.text,
              fontSize: 30
            }"
          />
          <v-transformer
            ref="transformer"
            :config="{ rotateEnabled: false, keepRatio: false }"
          />
        </v-group>
      </v-layer>
    </v-stage>
  </div>

  <!-- Bottom left zoom indicator -->
  <div
    v-if="paper?.mode === 'infinite'"
    class="absolute bottom-2 left-2 text-xs bg-foundation bg-opacity-80 rounded px-2 py-1 shadow"
  >
    {{ Math.round(canvasTransform.scaleX * 100) }}%
  </div>
</template>

<script setup lang="ts">
import ViewerContainer from '../viewer/Container.vue'
import CanvasPaperStaticLayer from '../canvas/paper/StaticLayer.vue'
import CanvasViewerContainer from '../canvas/viewer/Container.vue'
import { ref } from 'vue'
import { useCanvasStore } from '../../stores/canvas'
import { useCanvasStage } from '../../lib/paper/composables/useCanvasStage'
import type { Stage } from 'konva/lib/Stage'
import type { Transformer } from 'konva/lib/Shapes/Transformer'
import { useSelection } from '../../lib/paper/composables/useSelection'
import { useTextInput } from '../../lib/paper/composables/useTextInput'
import { useDrawingTool } from '../../lib/paper/composables/useDrawingTool'
import { useCRS } from '../../lib/paper/composables/useCRS'
import { getUniqueId } from '../../utils/index'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  paperId: string
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const stage = ref<Stage>()
const transformer = ref<Transformer>()

const isPanning = ref(false)
const lastPos = ref({ x: 0, y: 0 })

const store = useCanvasStore()
const paper = computed(() => store.getPaper(props.paperId))
const shapes = computed(() => paper.value?.shapes)

const { stageWidth, stageHeight, canvasTransform, fitViewerContainerToScreen } =
  useCanvasStage(stage, paper)

const { getWorldCoords } = useCRS(canvasTransform)

const {
  marquee,
  onMouseDown: onSelectionMouseDown,
  onMouseMove: onSelectionMouseMove,
  onMouseUp: onSelectionMouseUp
} = useSelection(stage, transformer, canvasTransform)

const selectedLineType = computed(() =>
  store.lineTypes.find((t) => t.kind === store.selectedLineType)
)

const resizeViewerContainer = (
  viewerContainerId: string,
  position: { x: number; y: number; width: number; height: number }
) => {
  store.updateViewerContainerSize(viewerContainerId, position, true)
}

const {
  liveShape,
  isPolylineClosable,
  polylineDrawingPositionX,
  polylineDrawingPositionY,
  onMouseDown: onDrawingMouseDown,
  onMouseMove: onDrawingMouseMove,
  onMouseUp: onDrawingMouseUp,
  finishDrawing,
  submitPolyline
} = useDrawingTool(props.paperId, emit, canvasTransform)

const {
  caretPos,
  showCaret,
  dimensions,
  onKeyDown: onKeyDownTextInput,
  onMouseDown: onTextInputMouseDown
} = useTextInput(props.paperId, canvasTransform, liveShape, finishDrawing)

function onWheel(e: any) {
  if (paper.value?.mode === 'adaptive') {
    return
  }
  e.evt.preventDefault()
  const scaleBy = 1.05
  const stage = e.target.getStage()
  const oldScale = canvasTransform.scaleX

  const pointer = stage.getPointerPosition()
  const mousePointTo = {
    x: (pointer.x - canvasTransform.x) / oldScale,
    y: (pointer.y - canvasTransform.y) / oldScale
  }

  const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  canvasTransform.scaleX = newScale
  canvasTransform.scaleY = newScale

  canvasTransform.x = pointer.x - mousePointTo.x * newScale
  canvasTransform.y = pointer.y - mousePointTo.y * newScale
}

function onStageClick(e: any) {
  const clickedOnEmpty = e.target === e.target.getStage()
  if (clickedOnEmpty) {
    const { showThickness } = storeToRefs(store)
    showThickness.value = false
  }
}

const handleMouseDown = async (e: any) => {
  //  panning first but we do wanna pan only on 'infinite' paper mode
  if (
    paper.value?.mode === 'infinite' &&
    (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey))
  ) {
    isPanning.value = true
    lastPos.value = { x: e.evt.clientX, y: e.evt.clientY }
    return
  }

  if (store.currentTool === 'select') {
    onSelectionMouseDown(e)
  } else if (store.currentTool === 'text') {
    onTextInputMouseDown(e)
  } else if (store.currentTool === 'viewer') {
    const id = getUniqueId()
    const pos = getWorldCoords(e)
    await store.createViewerContainer(id, pos?.x, pos?.y, 450, 350)
  } else {
    onDrawingMouseDown(e)
  }
}

const handleMouseMove = (e: any) => {
  if (isPanning.value) {
    const dx = e.evt.clientX - lastPos.value.x
    const dy = e.evt.clientY - lastPos.value.y
    canvasTransform.x += dx
    canvasTransform.y += dy
    lastPos.value = { x: e.evt.clientX, y: e.evt.clientY }
    return
  }
  if (store.currentTool === 'select') {
    onSelectionMouseMove(e)
  } else {
    onDrawingMouseMove(e)
  }
}

const handleMouseUp = (e: any) => {
  if (isPanning.value) {
    isPanning.value = false
    return
  }
  if (store.currentTool === 'select') {
    onSelectionMouseUp(e)
  } else {
    onDrawingMouseUp(e)
  }
}

// Touch events for tablets
function onTouchStart(e: TouchEvent) {
  // Prevent default browser behavior (scrolling, zooming, etc.)
  e.evt.preventDefault()
  e.evt.stopPropagation()
  handleMouseDown(e)
}

function onTouchMove(e: TouchEvent) {
  // Prevent default browser behavior (scrolling, zooming, etc.)
  e.evt.preventDefault()
  e.evt.stopPropagation()
  handleMouseMove(e)
}

function onTouchEnd(e: TouchEvent) {
  // Prevent default browser behavior (scrolling, zooming, etc.)
  e.evt.preventDefault()
  e.evt.stopPropagation()
  handleMouseUp(e)
}

function onKeyDown(e: KeyboardEvent) {
  if (store.currentTool === 'text') return // because we handle it on useTextInput composable, happiness level is 3/10

  if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedIds.length > 0) {
    store.deleteShapes(props.paperId, store.selectedIds)
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    submitPolyline()
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    finishDrawing()
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault()
    store.undo(props.paperId)
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
    e.preventDefault()
    store.redo(props.paperId)
  }
}

onMounted(() => {
  if (paper.value?.mode === 'adaptive' && paper.value.viewerContainers.length === 0) {
    const id = getUniqueId()
    store.createViewerContainer(
      id,
      0,
      0,
      paper.value?.width || 0,
      paper.value?.height || 0
    )
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', onKeyDownTextInput)

  const container = stage.value.getNode().container()

  // Prevent all touch-related browser behaviors
  const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']
  touchEvents.forEach((eventType) => {
    container.addEventListener(
      eventType,
      (e) => {
        e.preventDefault()
        e.stopPropagation()
      },
      { passive: false }
    )
  })

  // Prevent context menu on long press
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  // Prevent drag gestures
  container.addEventListener('dragstart', (e) => {
    e.preventDefault()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
