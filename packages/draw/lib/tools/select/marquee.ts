import { reactive } from 'vue'
import { useCanvasStore } from '../../../stores/canvas'
import { useCRS } from '../../../lib/paper/composables/useCRS'
import type { Stage } from 'konva/lib/Stage'
import type { Ref } from 'vue'

export function useMarquee(
  stage: Ref<Stage | undefined>,
  canvasTransform: { x: number; y: number; scaleX: number; scaleY: number }
) {
  const store = useCanvasStore()
  const { getWorldCoords } = useCRS(canvasTransform) // ✅ use it directly

  const marquee = reactive({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })

  let marqueeStart = { x: 0, y: 0 }

  const startMarquee = (e: any) => {
    const pos = getWorldCoords(e)
    if (!pos) return
    marqueeStart = pos
    marquee.x = pos.x
    marquee.y = pos.y
    marquee.width = 0
    marquee.height = 0
    marquee.visible = true
  }

  const updateMarquee = (e: any) => {
    const pos = getWorldCoords(e)
    if (!pos) return
    marquee.width = pos.x - marqueeStart.x
    marquee.height = pos.y - marqueeStart.y
  }

  const finishMarquee = () => {
    selectShapesInMarquee()
    marquee.visible = false
  }

  const selectShapesInMarquee = () => {
    const box = {
      x: Math.min(marquee.x, marquee.x + marquee.width),
      y: Math.min(marquee.y, marquee.y + marquee.height),
      width: Math.abs(marquee.width),
      height: Math.abs(marquee.height)
    }

    const selected: string[] = []
    stage.value
      ?.getStage()
      ?.find('Rect, Circle, Line, Arrow')
      .forEach((shape) => {
        const id = shape.id()
        if (!id) return

        const shapeBox = shape.getClientRect()

        const worldShapeBox = {
          x: (shapeBox.x - canvasTransform.x) / canvasTransform.scaleX,
          y: (shapeBox.y - canvasTransform.y) / canvasTransform.scaleY,
          width: shapeBox.width / canvasTransform.scaleX,
          height: shapeBox.height / canvasTransform.scaleY
        }

        if (isIntersecting(box, worldShapeBox)) {
          selected.push(id)
        }
      })

    if (selected.length === 0) store.deselectShapes()
    else store.selectShapes(selected)
  }

  const isIntersecting = (r1, r2) => {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    )
  }

  return {
    marquee,
    startMarquee,
    updateMarquee,
    finishMarquee
  }
}
