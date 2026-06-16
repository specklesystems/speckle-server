<template>
  <div
    :key="`viewer-${viewerContainer.id}`"
    class="absolute"
    :class="[
      store.cursorType,
      store.getActivePaper()?.mode === 'infinite' ? 'bg-foundation' : ''
    ]"
    :style="{
      left: `${canvasTransform.x + viewerContainer.x * canvasTransform.scaleX}px`,
      top: `${canvasTransform.y + viewerContainer.y * canvasTransform.scaleY}px`,
      width: `${viewerContainer.adaptiveContainer.width * canvasTransform.scaleX}px`,
      height: `${viewerContainer.adaptiveContainer.height * canvasTransform.scaleY}px`
    }"
  >
    <!-- Floating menu (always clickable, does not block canvas) -->
    <div
      class="absolute z-10 bg-foundation pt-1 pb-0.5 px-1 rounded-lg -top-12 space-x-0.5 border border-foundation-1 pointer-events-auto"
    >
      <FormButton
        v-tippy="'Move container'"
        :color="isMoving ? 'primary' : 'outline'"
        :icon-left="Move"
        hide-text
        @mousedown.prevent="(e) => onMouseDownForMove(e)"
      />
      <FormButton
        v-tippy="
          `Change to ${viewerContainer.mode === 'viewer' ? 'draw' : 'view'} mode`
        "
        :color="'outline'"
        :icon-left="viewerContainer.mode === 'viewer' ? Brush : Rotate3D"
        hide-text
        @click.stop="store.toggleViewerMode(viewerContainer.id)"
      />
      <FormButton
        v-tippy="`Fit to screen`"
        :color="'outline'"
        :icon-left="Fullscreen"
        hide-text
        @click.stop="emit('fitViewerContainerToScreen')"
      />
    </div>

    <!-- Viewer iframe/canvas -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center"
      :class="
        viewerContainer.mode === 'viewer'
          ? 'pointer-events-auto z-20'
          : 'pointer-events-none'
      "
    >
      <ViewerBase
        v-if="viewerContainer.modelUrl"
        :id="viewerContainer.id"
        :url="viewerContainer.modelUrl"
      />
      <div
        v-else
        class="absolute z-50 flex flex-row space-x-1 bg-white rounded shadow-md p-2 pointer-events-auto"
      >
        <input
          v-model="modelUrl"
          placeholder="Model URL"
          type="text"
          class="border rounded px-2 py-1 w-full"
        />
        <FormButton
          color="outline"
          @click.stop="store.loadModelIntoViewer(viewerContainer.id, modelUrl)"
        >
          Load
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Move, Rotate3D, Brush, Fullscreen } from 'lucide-vue-next'
import type { ViewerContainer } from '../../lib/paper'
import { throttle } from 'lodash-es'

const props = defineProps<{
  viewerContainer: ViewerContainer
  canvasTransform: any
}>()

const emit = defineEmits<{ (e: 'fitViewerContainerToScreen'): void }>()

const store = useCanvasStore()

const isMoving = ref(false)
const modelUrl = ref<string | undefined>(undefined)

let dragStartWorld = { x: 0, y: 0 }
let containerStartWorld = { x: 0, y: 0 }

function screenToWorld(e: MouseEvent) {
  return {
    x: (e.clientX - props.canvasTransform.x) / props.canvasTransform.scaleX,
    y: (e.clientY - props.canvasTransform.y) / props.canvasTransform.scaleY
  }
}

function onMouseDownForMove(e: MouseEvent) {
  isMoving.value = true

  dragStartWorld = screenToWorld(e)
  containerStartWorld = {
    x: props.viewerContainer.x,
    y: props.viewerContainer.y
  }

  const move = (ev: MouseEvent) => {
    if (!isMoving.value) return
    const world = screenToWorld(ev)
    const newX = containerStartWorld.x + (world.x - dragStartWorld.x)
    const newY = containerStartWorld.y + (world.y - dragStartWorld.y)
    throttledUpdate(
      props.viewerContainer.id,
      newX,
      newY,
      props.viewerContainer.adaptiveContainer.width,
      props.viewerContainer.adaptiveContainer.height
    )
  }

  const up = () => {
    isMoving.value = false
    store.updateViewerContainerSize(
      props.viewerContainer.id,
      {
        x: props.viewerContainer.x,
        y: props.viewerContainer.y,
        width: props.viewerContainer.adaptiveContainer.width,
        height: props.viewerContainer.adaptiveContainer.height
      },
      true
    )
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }

  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

const throttledUpdate = throttle(
  (id: string, x: number, y: number, w: number, h: number) => {
    store.updateViewerContainerSize(id, { x, y, width: w, height: h })
  },
  50 // ms
)
</script>
