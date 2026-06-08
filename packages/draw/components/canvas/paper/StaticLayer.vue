<template>
  <v-layer ref="staticLayer">
    <!-- Offset scale factor will be initial paper ratio of w/h -->
    <v-group :config="transform">
      <template v-for="shape in shapes" :key="shape.id">
        <!-- freehand hover at bottom -->
        <v-line
          v-if="isShapeNeedOverlay(shape, ['freehand'])"
          :config="{
            id: shape.id,
            x: shape.x,
            y: shape.y,
            points: shape.points,
            fill: '#0000FF',
            stroke: '#0000FF',
            strokeWidth: 4
          }"
        />

        <v-text
          v-else-if="shape.type === 'text'"
          :config="{
            id: shape.id,
            x: shape.x,
            y: shape.y,
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
            x: shape.x,
            y: shape.y,
            points: shape.points,
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
            x: shape.x,
            points: shape.points,
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
            x: shape.x,
            points: shape.points,
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
            x: shape.x,
            y: shape.y,
            width: shape.width,
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
            x: shape.x,
            y: shape.y,
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
            x: shape.x,
            points: shape.points,
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
            x: shape.x,
            y: shape.y,
            width: shape.width,
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
            x: shape.x,
            y: shape.y,
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
            x: shape.x,
            points: shape.points,
            stroke: '#0000FF',
            fill: shape.type === 'arrow' ? '#0000FF' : '',
            strokeWidth: 1,
            pointerLength: 0,
            pointerWidth: 0
          }"
        />
      </template>
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import type { Shape } from '../../../lib/paper'
import { useTransform } from '../../../lib/paper/composables/useTransform'
import { useCanvasStore } from '../../../stores/canvas'
// import { offsetX, offsetY, scale } from '~/lib/paper/composables/useViewerTransform'

const props = defineProps<{
  id: string
  transform?: any
  shapes: Shape[]
}>()

const staticLayer = ref<any>(null)

const store = useCanvasStore()
const { bake } = useTransform(props.id)

const hoveredShapeId = ref<string | undefined>(undefined)
const shapes = computed(() => store.getPaper(props.id)?.shapes)

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
  //bake(id, e.target)
}

function onShapeDragEnd(id: string, e: any) {
  bake(id, e.target)
  console.log(e.target)
  console.log(e.target.x())
  console.log(e.target.y())
}
</script>
