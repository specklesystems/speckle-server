<template>
  <v-group>
    <template v-for="shape in shapes" :key="shape.id">
      <!-- freehand hover at bottom -->
      <v-line
        v-if="isShapeNeedOverlay(shape, ['freehand'])"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          fill: '#0000FF',
          stroke: '#0000FF',
          strokeWidth: 4
        }"
      />

      <v-text
        v-else-if="shape.type === 'text'"
        :config="{
          id: shape.id,
          x: shape.x + offsetX(shape),
          y: shape.y,
          scaleX: scale(shape),
          scaleY: scale(shape),
          fill: shape.fillColor,
          text: shape.text,
          fontSize: 30,
          draggable: store.selectedIds.includes(shape.id)
        }"
        @click="onShapeClick($event)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <v-line
        v-if="shape.type === 'freehand'"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          fill: shape.strokeColor,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          closed: true,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0,
          draggable: store.selectedIds.includes(shape.id)
        }"
        @click="onShapeClick($event)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <v-arrow
        v-else-if="shape.type === 'arrow'"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          fill: shape.strokeColor,
          draggable: store.selectedIds.includes(shape.id),
          pointerLength: 20,
          pointerWidth: 20
        }"
        @click="onShapeClick($event)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <v-line
        v-else-if="shape.type === 'polyline'"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
          draggable: store.selectedIds.includes(shape.id),
          dash: shape.dash
        }"
        @click="onShapeClick($event)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <v-rect
        v-else-if="shape.type === 'rect'"
        :config="{
          id: shape.id,
          x: shape.x + offsetX(shape),
          y: shape.y,
          width: shape.width,
          scaleX: scale(shape),
          scaleY: scale(shape),
          height: shape.height,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          fill: 'transparent',
          draggable: store.selectedIds.includes(shape.id),
          dash: shape.dash
        }"
        @click="onShapeClick($event)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <v-circle
        v-else-if="shape.type === 'circle'"
        :config="{
          id: shape.id,
          x: shape.x + offsetX(shape),
          y: shape.y,
          scaleX: scale(shape),
          scaleY: scale(shape),
          radius: Math.abs(shape.width / 2),
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          fill: 'transparent',
          draggable: store.selectedIds.includes(shape.id),
          dash: shape.dash
        }"
        @click="onShapeClick($event, shape.id)"
        @dragend="(e) => onShapeDragEnd(shape.id, e)"
        @transformend="(e) => onShapeTransformEnd(shape.id, e)"
        @mouseover="onShapeMouseOver(shape.id)"
        @mouseout="onShapeMouseOut()"
      />

      <!-- HOVER -->

      <v-line
        v-if="isShapeNeedOverlay(shape, ['line', 'polyline'])"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          stroke: '#0000FF',
          strokeWidth: 0.5,
          closed: true,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0
        }"
      />

      <v-rect
        v-else-if="isShapeNeedOverlay(shape, ['rect'])"
        :config="{
          id: shape.id,
          x: shape.x + offsetX(shape),
          y: shape.y,
          width: shape.width,
          scaleX: scale(shape),
          scaleY: scale(shape),
          height: shape.height,
          stroke: '#0000FF',
          strokeWidth: 0.5,
          fill: 'transparent'
        }"
      />

      <v-circle
        v-else-if="isShapeNeedOverlay(shape, ['circle'])"
        :config="{
          id: shape.id,
          x: shape.x + offsetX(shape),
          y: shape.y,
          scaleX: scale(shape),
          scaleY: scale(shape),
          radius: Math.abs(shape.width / 2),
          stroke: '#0000FF',
          strokeWidth: 0.5,
          fill: 'transparent'
        }"
      />

      <v-arrow
        v-else-if="isShapeNeedOverlay(shape, ['arrow'])"
        :config="{
          id: shape.id,
          x: offsetX(shape),
          points: shape.points,
          scaleX: scale(shape),
          scaleY: scale(shape),
          stroke: '#0000FF',
          fill: shape.type === 'arrow' ? '#0000FF' : '',
          strokeWidth: 1,
          pointerLength: 0,
          pointerWidth: 0
        }"
      />
    </template>
  </v-group>
</template>

<script setup lang="ts">
import type { Shape } from '../../../lib/paper'
import { useCanvasStore } from '../../../stores/canvas'

const props = defineProps<{
  id: string
  shapes: Shape[]
}>()

watch(
  () => props.shapes,
  (newShapes) => {
    console.log('Shapes updated', newShapes)
  }
)

const store = useCanvasStore()

const hoveredShapeId = ref<string | undefined>(undefined)

const shapeInitialRatio = (shape: Shape) =>
  shape.containerWidthOnCreate / shape.containerHeightOnCreate
const offsetY = (shape: Shape) =>
  (shape.currentContainerHeight - shape.containerHeightOnCreate) / 2
// OK - this is the simple math magic 🪄
// Since we scale viewer on only height change,
// we need to substract the scaled offset according to the initial w/h ratio whenever the shape is created
const offsetX = (shape: Shape) =>
  (shape.currentContainerWidth - shape.containerWidthOnCreate) / 2 -
  offsetY(shape) * shapeInitialRatio(shape)
// scaling on effect on both x and y since we scale viewer equally
const scale = (shape: Shape) =>
  shape.currentContainerHeight / shape.containerHeightOnCreate

const onShapeMouseOver = (id: string) => {
  document.body.style.cursor = 'pointer'
  hoveredShapeId.value = id
}

const onShapeMouseOut = () => {
  document.body.style.cursor = 'default'
  hoveredShapeId.value = undefined
}

const isShapeNeedOverlay = (shape: Shape, toolsToCheck: string[]) => {
  return (
    toolsToCheck.includes(shape.type) &&
    (store.selectedIds.includes(shape.id) || shape.id === hoveredShapeId.value)
  )
}

function onShapeClick(e) {
  e.cancelBubble = true
  store.selectShapes([e.target.id()])
}

function onShapeTransformEnd(id: string, e: any) {
  bakeTransform(props.id, id, e.target)
}

function onShapeDragEnd(id: string, e: any) {
  bakeTransform(props.id, id, e.target)
}

function bakeTransform(paperId: string, id: string, node: any) {
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
    const newPoints: number[] = []
    for (let i = 0; i < shape.points.length; i += 2) {
      newPoints.push(shape.points[i] * scaleX + x)
      newPoints.push(shape.points[i + 1] * scaleY + y)
    }
    updates.points = newPoints
    updates.x = 0
    updates.y = 0
    updates.rotation = 0
  } else if (shape.type === 'rect' || shape.type === 'circle') {
    updates.x = x
    updates.y = y
    updates.width = shape.width * scaleX
    updates.height = shape.height * scaleY
    updates.rotation = rotation
  } else if (shape.type === 'text') {
    updates.x = x
    updates.y = y
    updates.fontSize = (shape.fontSize || 30) * scaleY
    updates.rotation = rotation
  }

  store.updateShape(paperId, id, updates)

  // 🔑 reset node so it doesn’t double-apply the transform
  node.scale({ x: 1, y: 1 })
  node.rotation(0)
  node.position({ x: 0, y: 0 })
}
</script>
