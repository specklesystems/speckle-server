import type { Stage } from 'konva/lib/Stage'
import { reactive, watch, computed } from 'vue'
import type { Ref } from 'vue'
import type { ViewerContainer, Paper } from '~/lib/paper'

export function useCanvasStage(
  stage: Ref<Stage | undefined>,
  paper: Ref<Paper | undefined>
) {
  const currentSize = reactive({
    w: paper.value?.width || 0,
    h: paper.value?.height || 0
  })

  const canvasTransform = reactive({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1
  })

  const fitViewerContainerToScreen = (c: ViewerContainer) => {
    if (!stage.value) return

    const sw = currentSize.w
    const sh = currentSize.h

    console.log('fitViewerContainerToScreen', sw, sh)

    const scale = Math.min(
      sw / c.adaptiveContainer.width,
      sh / c.adaptiveContainer.height
    )

    canvasTransform.scaleX = scale
    canvasTransform.scaleY = scale

    const offsetX = (sw - c.adaptiveContainer.width * scale) / 2
    const offsetY = (sh - c.adaptiveContainer.height * scale) / 2

    canvasTransform.x = offsetX - c.x * scale
    canvasTransform.y = offsetY - c.y * scale
  }

  watch(
    () => [paper.value?.width, paper.value?.height],
    ([w, h]) => {
      currentSize.w = w || 0
      currentSize.h = h || 0

      const st = stage.value?.getNode?.()
      if (st) {
        st.size({ width: currentSize.w, height: currentSize.h })
        st.batchDraw()
      }
    },
    { immediate: true }
  )

  return {
    stageWidth: computed(() => currentSize.w),
    stageHeight: computed(() => currentSize.h),
    canvasTransform,
    fitViewerContainerToScreen
  }
}
