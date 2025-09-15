// ~/lib/paper/composables/useDrawingTool.ts
import { ref, markRaw } from 'vue'
import { getStroke } from 'perfect-freehand'
import { getUniqueId } from '../../../utils'
import { chaikin } from '../../../lib/drawing/chaikin'
import type { Shape, FreehandShape } from '../../../lib/paper'
import { useCanvasStore } from '../../../stores/canvas'
import { useCRS } from './useCRS'

// TODO: would be nice to have separate composables for each shape type
export function useDrawingTool(
  paperId: string,
  emit: (e: 'changed') => void,
  canvasTransform: { x: number; y: number; scaleX: number; scaleY: number }
) {
  const store = useCanvasStore()

  const { getWorldCoords, getContainerAtPosition } = useCRS(canvasTransform)

  const liveShape = ref<Shape | null>(null)
  const isDrawing = ref(false)
  const trace: number[][] = []
  let rafId = 0
  const polylineClickCount = ref(0)
  const isPolylineClosable = ref(false)

  const polylineDrawingPositionX = ref(0)
  const polylineDrawingPositionY = ref(0)

  const scheduleDraw = (drawFn: () => void) => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(drawFn)
  }

  const drawFreehand = () => {
    if (!liveShape.value || !trace.length) return
    const points = getStroke(trace, { size: store.brushSize })
    ;(liveShape.value as any).points = markRaw(points.flat())
  }

  const onMouseDown = (e: any) => {
    const pos = getWorldCoords(e)
    const viewerContainer = getContainerAtPosition(e, paperId)
    const paper = store.getPaper(paperId)
    if (!pos || !paper) return

    switch (store.currentTool) {
      case 'freehand': {
        trace.length = 0
        trace.push([pos.x, pos.y])

        const stroke = getStroke([[pos.x, pos.y]], { size: store.brushSize })
        liveShape.value = {
          id: getUniqueId(),
          type: 'freehand',
          strokeColor: store.currentStrokeColor,
          fillColor: store.currentStrokeColor,
          containerWidthOnCreate: viewerContainer
            ? viewerContainer.adaptiveContainer.width
            : undefined,
          containerHeightOnCreate: viewerContainer
            ? viewerContainer.adaptiveContainer.height
            : undefined,
          currentContainerWidth: viewerContainer
            ? viewerContainer.adaptiveContainer.width
            : undefined,
          currentContainerHeight: viewerContainer
            ? viewerContainer.adaptiveContainer.height
            : undefined,
          points: stroke.flat(),
          trace: markRaw([[pos.x, pos.y]])
        } as FreehandShape
        isDrawing.value = true
        scheduleDraw(drawFreehand)
        break
      }
      case 'arrow': {
        liveShape.value = {
          id: getUniqueId(),
          type: 'arrow',
          points: [pos.x, pos.y],
          containerWidthOnCreate: viewerContainer
            ? viewerContainer.adaptiveContainer.width
            : undefined,
          containerHeightOnCreate: viewerContainer
            ? viewerContainer.adaptiveContainer.height
            : undefined,
          currentContainerWidth: viewerContainer
            ? viewerContainer.adaptiveContainer.width
            : undefined,
          currentContainerHeight: viewerContainer
            ? viewerContainer.adaptiveContainer.height
            : undefined,
          strokeColor: store.currentStrokeColor,
          strokeWidth: store.brushSize,
          dash: store.lineTypes.find((t) => t.kind === store.selectedLineType)?.values
        }
        isDrawing.value = true
        break
      }
      case 'polyline': {
        polylineClickCount.value++
        if (isDrawing.value && liveShape.value) {
          return (liveShape.value as any).points.push(pos.x, pos.y)
        } else {
          liveShape.value = {
            id: getUniqueId(),
            type: 'polyline',
            points: [pos.x, pos.y],
            containerWidthOnCreate: viewerContainer
              ? viewerContainer.adaptiveContainer.width
              : undefined,
            containerHeightOnCreate: viewerContainer
              ? viewerContainer.adaptiveContainer.height
              : undefined,
            currentContainerWidth: viewerContainer
              ? viewerContainer.adaptiveContainer.width
              : undefined,
            currentContainerHeight: viewerContainer
              ? viewerContainer.adaptiveContainer.height
              : undefined,
            strokeColor: store.currentStrokeColor,
            strokeWidth: store.brushSize,
            dash: store.lineTypes.find((t) => t.kind === store.selectedLineType)?.values
          }
          isDrawing.value = true
        }
        break
      }
    }
  }

  const onMouseMove = (e: any) => {
    const pos = getWorldCoords(e)
    if (!pos) return
    polylineDrawingPositionX.value = pos.x
    polylineDrawingPositionY.value = pos.y

    if (isDrawing.value && liveShape.value) {
      switch (liveShape.value.type) {
        case 'arrow':
          return ((liveShape.value as any).points = [
            (liveShape.value as any).points[0],
            (liveShape.value as any).points[1],
            pos.x,
            pos.y
          ])
          break
        case 'polyline': {
          if (
            Math.abs((liveShape.value as any).points[0] - pos.x) <= 10 &&
            Math.abs((liveShape.value as any).points[1] - pos.y) <= 10
          ) {
            polylineDrawingPositionX.value = (liveShape.value as any).points[0]
            polylineDrawingPositionY.value = (liveShape.value as any).points[1]
            isPolylineClosable.value = true
          } else {
            isPolylineClosable.value = false
          }
          return ((liveShape.value as any).points = [
            ...(liveShape.value as any).points.slice(0, polylineClickCount.value * 2),
            pos.x,
            pos.y
          ])
          break
        }
        case 'freehand': {
          const lastTrace = trace[trace.length - 1]
          if (!lastTrace || Math.hypot(pos.x - lastTrace[0], pos.y - lastTrace[1]) < 2)
            return
          trace.push([pos.x, pos.y])
          ;(liveShape.value as any).points = getStroke(trace, {
            size: store.brushSize
          }).flat()
          scheduleDraw(drawFreehand)
          break
        }
      }
    }
  }

  const onMouseUp = (e: any) => {
    if (!liveShape.value) return

    if (liveShape.value.type === 'polyline') {
      const pos = getWorldCoords(e)
      if (isPolylineClosable.value) {
        const points = (liveShape.value as any).points
        const firstX = points[0]
        const firstY = points[1]
        points.splice(-4)
        points.push(firstX, firstY)
        const viewerContainer = getContainerAtPosition(e, paperId)
        store.addShape(paperId, liveShape.value, viewerContainer?.id)
        finishDrawing()
      } else {
        ;(liveShape.value as any).points.push(pos.x, pos.y)
      }
      return
    }

    if (isDrawing.value) {
      const viewerContainer = getContainerAtPosition(e, paperId)
      isDrawing.value = false
      cancelAnimationFrame(rafId)

      switch (liveShape.value.type) {
        case 'freehand':
          store.addShape(
            paperId,
            {
              ...liveShape.value,
              points: chaikin((liveShape.value as any).points, 2)
            },
            viewerContainer?.id
          )
          break
        case 'arrow':
          store.addShape(paperId, liveShape.value, viewerContainer?.id)
          break
      }

      emit('changed')
      liveShape.value = null
      trace.length = 0
    }
  }

  const finishDrawing = () => {
    isDrawing.value = false
    polylineClickCount.value = 0
    isPolylineClosable.value = false
    liveShape.value = null
  }

  const submitPolyline = () => {
    if (isPolylineClosable.value) {
      const points = liveShape.value.points
      const firstX = points[0]
      const firstY = points[1]

      points.splice(-4)
      points.push(firstX, firstY)
    }
    store.addShape(paperId, liveShape.value)
    finishDrawing()
  }

  return {
    polylineDrawingPositionX,
    polylineDrawingPositionY,
    liveShape,
    isDrawing,
    isPolylineClosable,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    finishDrawing,
    submitPolyline
  }
}
