import { useCanvasStore } from '../../../stores/canvas'

export function useTransform(paperId: string) {
  const store = useCanvasStore()

  function bake(id: string, node: any) {
    const shape = store.getShape(paperId, id)
    if (!shape) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()
    const x = node.x()
    const y = node.y()

    const updates: any = {}

    if (
      shape.type === 'freehand' ||
      shape.type === 'polyline' ||
      shape.type === 'arrow'
    ) {
      // ❌ OLD: baked into points
      // const newPoints: number[] = []
      // for (let i = 0; i < shape.points.length; i += 2) {
      //   newPoints.push(shape.points[i] * scaleX + x)
      //   newPoints.push(shape.points[i + 1] * scaleY + y)
      // }
      // updates.points = newPoints
      // updates.x = 0
      // updates.y = 0
      // updates.rotation = 0

      // ✅ NEW: keep raw points, update only x/y + maybe strokeWidth scaling
      updates.x = (shape.x || 0) + x
      updates.y = (shape.y || 0) + y
      updates.strokeWidth = (shape.strokeWidth || 1) * scaleX // uniform scaling
      updates.rotation = rotation
    } else if (shape.type === 'rect' || shape.type === 'circle') {
      updates.x = (shape.x || 0) + x
      updates.y = (shape.y || 0) + y
      updates.width = shape.width * scaleX
      updates.height = shape.height * scaleY
      updates.rotation = rotation
    } else if (shape.type === 'text') {
      updates.x = (shape.x || 0) + x
      updates.y = (shape.y || 0) + y
      updates.fontSize = (shape.fontSize || 30) * scaleY
      updates.rotation = rotation
    }

    store.updateShape(paperId, id, updates)

    // Reset node back to neutral
    node.scale({ x: 1, y: 1 })
    node.rotation(0)
    node.position({ x: 0, y: 0 })
  }

  return { bake }
}
