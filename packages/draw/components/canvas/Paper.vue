<template>
  <div
    class="absolute inset-0"
    :class="`${cursorType}`"
    style="touch-action: none; user-select: none; -webkit-user-select: none"
  >
    <!-- <div class="fixed top-0 right-0 z-50">
      {{ `${paper?.currentWidth} x ${paper?.currentHeight}` }}
    </div> -->
    <v-stage
      ref="stage"
      :config="{ width: stageWidth, height: stageHeight }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="onStageClick"
    >
      <CanvasPaperStaticLayer :id="id" />
      <v-layer>
        <!-- Group of utility shapes -->
        <v-group>
          <v-rect
            v-if="isPolylineClosable"
            :config="{
              x: polylineDrawingPositionX - 8,
              y: polylineDrawingPositionY - 8,
              width: 16,
              height: 16,
              stroke: 'red',
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
        <v-group>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCanvasStage } from '~/lib/paper/composables/useCanvasStage'
import type { Stage } from 'konva/lib/Stage'
import type { Transformer } from 'konva/lib/Shapes/Transformer'
import { useSelection } from '~/lib/paper/composables/useSelection'
import { useTextInput } from '~/lib/paper/composables/useTextInput'
import { useDrawingTool } from '~/lib/paper/composables/useDrawingTool'

const props = defineProps<{
  id: string
  size: { w: number; h: number }
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const stage = ref<Stage>()
const transformer = ref<Transformer>()

const store = useCanvasStore()
const paper = computed(() => store.getPaper(props.id))

const { stageWidth, stageHeight } = useCanvasStage(stage, paper)
const {
  marquee,
  onMouseDown: onSelectionMouseDown,
  onMouseMove: onSelectionMouseMove,
  onMouseUp: onSelectionMouseUp
} = useSelection(stage, transformer)

const selectedLineType = computed(() =>
  store.lineTypes.find((t) => t.kind === store.selectedLineType)
)

const cursorType = computed(() => {
  if (store.currentTool === 'text') {
    return 'cursor-text'
  } else if (['line', 'polyline', 'freehand', 'arrow'].includes(store.currentTool)) {
    return 'cursor-crosshair'
  } else {
    return ''
  }
})

watch(
  () => store.selectedIds,
  (ids: string[]) => {
    if (!transformer.value) return
    const tr = transformer.value.getNode()
    const stage = tr.getStage()
    if (!stage) return

    // Find all matching nodes
    const selectedNodes = ids
      .map((id) => stage.findOne(`#${id}`))
      .filter((node) => node) // remove nulls

    tr.nodes(selectedNodes)
    tr.getLayer().batchDraw()
  }
)

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
} = useDrawingTool(props.id, emit)

const {
  caretPos,
  showCaret,
  dimensions,
  onKeyDown: onKeyDownTextInput,
  onMouseDown: onTextInputMouseDown
} = useTextInput(props.id, liveShape, finishDrawing)

function onStageClick(e: any) {
  const clickedOnEmpty = e.target === e.target.getStage()
  if (clickedOnEmpty) {
    const { showThickness } = storeToRefs(store)
    showThickness.value = false
  }
}

const handleMouseDown = (e: any) => {
  if (store.currentTool === 'select') {
    onSelectionMouseDown(e)
  } else if (store.currentTool === 'text') {
    onTextInputMouseDown(e)
  } else {
    onDrawingMouseDown(e)
  }
}

const handleMouseMove = (e: any) => {
  if (store.currentTool === 'select') {
    onSelectionMouseMove(e)
  } else {
    onDrawingMouseMove(e)
  }
}

const handleMouseUp = (e: any) => {
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
    store.deleteShapes(props.id, store.selectedIds)
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
    store.undo(props.id)
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
    e.preventDefault()
    store.redo(props.id)
  }
}

// TODO: have only 1 onMounted
// onMounted(() => {
//   const st = stage.value?.getNode?.()
//   if (!st) return
//   st.size({
//     width: paper.value?.currentWidth || 0,
//     height: paper.value?.currentHeight || 0
//   }) // keep coordinates in screen-space
//   st.batchDraw()
// })

onMounted(() => {
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
