import { watch } from 'vue'
import { useMarquee } from '../../../lib/tools/select/marquee'
import type { Stage } from 'konva/lib/Stage'
import type { Transformer } from 'konva/lib/Shapes/Transformer'
import { useCanvasStore } from '../../../stores/canvas'

export function useSelection(
  stage: Ref<Stage | undefined>,
  transformer: Ref<Transformer | undefined>,
  canvasTransform: { x: number; y: number; scaleX: number; scaleY: number }
) {
  const store = useCanvasStore()
  const { marquee, startMarquee, updateMarquee, finishMarquee } = useMarquee(
    stage,
    canvasTransform
  )

  watch(
    () => store.selectedIds,
    (ids: string[]) => {
      const tr = transformer.value?.getNode()
      if (!tr) return
      const stage = tr.getStage()
      if (!stage) return
      const nodes = ids.map((id) => stage.findOne(`#${id}`)).filter(Boolean)
      tr.nodes(nodes)
      tr.getLayer().batchDraw()
    }
  )

  // --- Event handlers for CanvasStage ---
  function onMouseDown(e: any) {
    if (store.currentTool !== 'select') return
    const pos = e.target.getStage().getPointerPosition()
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty && pos) startMarquee(e)
  }

  function onMouseMove(e: any) {
    if (store.currentTool !== 'select') return
    if (!marquee.visible) return
    const pos = e.target.getStage().getPointerPosition()
    if (pos) updateMarquee(e)
  }

  function onMouseUp() {
    if (store.currentTool !== 'select') return
    if (marquee.visible) finishMarquee()
  }

  return {
    marquee,
    onMouseDown,
    onMouseMove,
    onMouseUp
  }
}
