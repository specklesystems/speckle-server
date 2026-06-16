<template>
  <div class="absolute inset-0 cursor-move">
    <div
      :id="`viewer-renderer-${props.id}`"
      ref="viewerContainer"
      class="absolute top-0 h-full w-full overflow-hidden"
      :class="viewerMode ? 'z-10 viewer-mode-active' : ''"
    />

    <CommonLoadingBar :loading="viewerStore.isLoading" class="relative w-2/3" />
  </div>
</template>
<script setup lang="ts">
import {
  Viewer,
  DefaultViewerParams,
  CameraController,
  SelectionExtension,
  ViewerEvent,
  SectionTool,
  CameraEvent
} from '@speckle/viewer'
import { useResizeObserver, useDebounceFn } from '@vueuse/core'
import { Vector3 } from 'three'
import { useViewerStore } from '~/stores/sharedViewer'

const viewerStore = useViewerStore()
const canvasStore = useCanvasStore()
const { viewerMode } = storeToRefs(canvasStore)

const props = defineProps<{
  id: string
  size: { w: number; h: number }
}>()

const emit = defineEmits<{ (e: 'view-changed'): void }>()

const viewerContainer = ref<HTMLElement | null>(null)

// Touch gesture detection variables for viewer
let touchDecided = false
let touchMode: string | null = null
let initialTouchX = 0
let initialTouchY = 0
const touchAction = 'none' // Viewer should handle all touches when active

// Intelligent scroll prevention for iOS
const disableScroll = (event: TouchEvent) => {
  event.preventDefault()
}

let viewer: Viewer

watch(
  () => [props.size.w, props.size.h],
  () => {
    // container is already 100% size via CSS; just notify viewer
    viewer?.resize()
  }
)

const initializeViewer = async () => {
  const container = document.getElementById(`viewer-renderer-${props.id}`)

  /** Configure the viewer params */
  const params = DefaultViewerParams

  /** Create Viewer instance */
  viewer = new Viewer(container!, params)
  /** Initialise the viewer */
  await viewer.init()

  viewer.createExtension(CameraController)
  viewer.createExtension(SelectionExtension)
  viewer.createExtension(SectionTool)

  viewer.resize()
  const debouncedResize = useDebounceFn(() => viewer.resize(), 500)
  useResizeObserver(container, debouncedResize)

  const selectionExtension = viewer.getExtension<SelectionExtension>(SelectionExtension)

  viewer.on(ViewerEvent.ObjectClicked, () => {
    viewerStore.setSelectedObjects(props.id, selectionExtension.getSelectedObjects())
  })

  const cameraController = viewer.getExtension<CameraController>(CameraController)
  cameraController.on(CameraEvent.Stationary, () => {
    emit('view-changed')
    canvasStore.setCameraPosition(
      props.id,
      cameraController.getPosition(),
      cameraController.getTarget()
    )
  })

  // Add intelligent touch handling for viewer mode
  if (container) {
    container.addEventListener('touchstart', handleViewerTouchStart, { passive: true })
    container.addEventListener('touchmove', handleViewerTouchMove, { passive: false })
    container.addEventListener('touchend', handleViewerTouchEnd, { passive: false })
  }
}

const handleViewerTouchStart = (e: TouchEvent) => {
  if (!viewerMode.value) return

  touchDecided = false
  touchMode = 'interact'

  const touch = e.touches[0]
  initialTouchX = touch.clientX
  initialTouchY = touch.clientY
}

const handleViewerTouchMove = (e: TouchEvent) => {
  if (!viewerMode.value) return

  const touch = e.touches[0]
  const dx = touch.clientX - initialTouchX
  const dy = touch.clientY - initialTouchY

  // Intelligent gesture detection for viewer
  if (!touchDecided && touchAction !== 'none') {
    touchDecided = true
    const dxMag = Math.abs(dx)
    const dyMag = Math.abs(dy)

    // For viewer mode, we're more aggressive about preventing scroll
    // Only allow scroll if it's a clear vertical swipe with minimal horizontal movement
    if (dyMag > dxMag && dyMag > 15 && dxMag < 5) {
      touchMode = null
      return // Allow browser default scrolling
    } else {
      // This looks like a 3D navigation gesture, prevent scrolling
      if (viewerContainer.value) {
        viewerContainer.value.addEventListener('touchmove', disableScroll, {
          passive: false
        })
      }
    }
  }

  // Prevent scrolling for interaction gestures
  if (touchMode) {
    e.preventDefault()
  }
}

const handleViewerTouchEnd = (e: TouchEvent) => {
  if (!viewerMode.value) return

  // Clean up scroll prevention
  if (viewerContainer.value) {
    viewerContainer.value.removeEventListener('touchmove', disableScroll)
  }

  // Reset state
  touchDecided = false
  touchMode = null
}

onMounted(async () => {
  await initializeViewer()
  viewerStore.registerViewer(props.id, viewer)
  const paper = canvasStore.getPaper(props.id)
  if (paper && paper.modelUrl) {
    await viewerStore.loadModelByUrl(props.id, paper.modelUrl)
    const activeSnapshot = canvasStore.getActiveSnapshot(paper.id)
    if (activeSnapshot && activeSnapshot.viewer && activeSnapshot.viewer.camera) {
      const position = new Vector3(
        activeSnapshot.viewer.camera?.position.x,
        activeSnapshot.viewer.camera?.position.y,
        activeSnapshot.viewer.camera?.position.z
      )
      const target = new Vector3(
        activeSnapshot.viewer.camera.target.x,
        activeSnapshot.viewer.camera.target.y,
        activeSnapshot.viewer.camera.target.z
      )
      viewer.getExtension(CameraController).setCameraView({ position, target }, true)
    }
  }
})

onBeforeUnmount(() => {
  viewerStore.removeViewerModelData(props.id)
  viewerStore.unregisterViewer(props.id)
})
</script>
