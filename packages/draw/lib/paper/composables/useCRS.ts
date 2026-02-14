import type { ViewerContainer } from '..'
import { useCanvasStore } from '../../../stores/canvas'

export function useCRS(canvasTransform: {
  x: number
  y: number
  scaleX: number
  scaleY: number
}) {
  const canvasStore = useCanvasStore()

  const getWorldCoords = (e: any) => {
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return null

    const x = (pointer.x - canvasTransform.x) / canvasTransform.scaleX
    const y = (pointer.y - canvasTransform.y) / canvasTransform.scaleY

    // console.log(x, y, 'world coordinates')

    return {
      x,
      y
    }
  }

  const getContainerAtPosition = (
    e: any,
    paperId: string
  ): ViewerContainer | undefined => {
    const world = getWorldCoords(e)
    if (!world) return undefined

    const activePaper = canvasStore.getPaper(paperId)
    if (!activePaper) return undefined

    const container = activePaper.viewerContainers.find(
      (c) =>
        world.x >= c.x &&
        world.x <= c.x + c.adaptiveContainer.width &&
        world.y >= c.y &&
        world.y <= c.y + c.adaptiveContainer.height
    )

    return container
  }

  return {
    getWorldCoords,
    getContainerAtPosition
  }
}
