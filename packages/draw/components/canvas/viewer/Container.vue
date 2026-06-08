<template>
  <!-- Group with clip: shapes stay inside -->
  <v-group
    :config="{
      x,
      y,
      clip: {
        x: 0,
        y: 0,
        width: container.width,
        height: container.height
      }
    }"
  >
    <CanvasViewerStaticLayer
      :id="container.id"
      :shapes="container.liveSnapshot.shapes"
      :transform="canvasTransform"
    />
  </v-group>

  <!-- Overlay group: boundary + handles (NOT clipped) -->
  <v-group v-if="store.getActivePaper()?.mode === 'infinite'" :config="{ x, y }">
    <!-- Boundary rect -->
    <v-rect
      :config="{
        width: container.width,
        height: container.height,
        stroke: isHovered ? '#4761C9' : '#D1D1D1',
        strokeWidth: 0.5,
        strokeScaleEnabled: false
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    />

    <!-- Handles for resizing -->
    <v-rect
      v-for="handle in handles"
      :key="handle.key"
      :config="{
        x: handle.x + HANDLE_SIZE / 2,
        y: handle.y + HANDLE_SIZE / 2,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        fill: 'white',
        draggable: true,
        strokeWidth: 1,
        strokeScaleEnabled: false,
        offsetX: HANDLE_SIZE / 2,
        offsetY: HANDLE_SIZE / 2,
        opacity: isHovered ? 1 : 0,
        stroke: '#4761C9',
        scaleX: 1 / canvasTransform.scaleX,
        scaleY: 1 / canvasTransform.scaleY
      }"
      @dragmove="(e) => onHandleDragMove(e, handle.position)"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { AdaptiveContainer } from '../../../lib/paper'
import { useCanvasStore } from '../../../stores/canvas'
import CanvasViewerStaticLayer from './StaticLayer.vue'
import { throttle } from 'lodash-es'

const props = defineProps<{
  container: AdaptiveContainer
  canvasTransform: any
  x?: number
  y?: number
}>()
const emit = defineEmits<{
  (e: 'resize', payload: { x: number; y: number; width: number; height: number }): void
}>()

const store = useCanvasStore()

const HANDLE_SIZE = 8
const isHovered = ref(false)

/**
 * Compute handle anchors relative to current width/height
 */
const handles = computed(() => {
  const w = props.container.width
  const h = props.container.height
  return [
    { key: 'tl', x: -HANDLE_SIZE / 2, y: -HANDLE_SIZE / 2, position: 'top-left' },
    { key: 'tr', x: w - HANDLE_SIZE / 2, y: -HANDLE_SIZE / 2, position: 'top-right' },
    { key: 'bl', x: -HANDLE_SIZE / 2, y: h - HANDLE_SIZE / 2, position: 'bottom-left' },
    {
      key: 'br',
      x: w - HANDLE_SIZE / 2,
      y: h - HANDLE_SIZE / 2,
      position: 'bottom-right'
    }
  ]
})

/**
 * Resize by dragging handles
 */
function onHandleDragMove(e, position) {
  const group = e.target.getParent()
  const pointer = group.getRelativePointerPosition()
  if (!pointer) return

  let { width, height } = props.container
  const mouseX = pointer.x
  const mouseY = pointer.y
  let x = props.x || 0
  let y = props.y || 0

  switch (position) {
    case 'top-left':
      width = width + (0 - mouseX)
      height = height + (0 - mouseY)
      x += mouseX
      y += mouseY
      break
    case 'top-right':
      width = mouseX
      height = height + (0 - mouseY)
      y += mouseY
      break
    case 'bottom-left':
      width = width + (0 - mouseX)
      height = mouseY
      x += mouseX
      break
    case 'bottom-right':
      width = mouseX
      height = mouseY
      break
  }

  const newPosition = { x, y, width, height }

  throttledEmitResize(newPosition)
}

const throttledEmitResize = throttle(
  (payload: { x: number; y: number; width: number; height: number }) => {
    emit('resize', payload)
  },
  50
)
</script>
