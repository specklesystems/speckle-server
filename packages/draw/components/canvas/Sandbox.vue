<template>
  <v-stage
    ref="stage"
    :config="stageSize"
    @mousedown="handleStageMouseDown"
    @touchstart="handleStageMouseDown"
  >
    <v-layer ref="layer">
      <v-rect
        v-for="item in rectangles"
        :key="item.id"
        :config="item"
        @transformend="handleTransformEnd"
      />
      <v-transformer ref="transformer" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref } from 'vue'
import Konva from 'konva'

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
}

const rectangles = ref([
  {
    rotation: 0,
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    scaleX: 1,
    scaleY: 1,
    fill: 'red',
    name: 'rect1',
    draggable: true
  },
  {
    rotation: 0,
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    scaleX: 1,
    scaleY: 1,
    fill: 'green',
    name: 'rect2',
    draggable: true
  }
])

const selectedShapeName = ref('')
const transformer = ref(null)

const handleTransformEnd = (e) => {
  // find element in our state
  const rect = rectangles.value.find((r) => r.name === selectedShapeName.value)
  if (!rect) return

  // update the state with new properties
  rect.x = e.target.x()
  rect.y = e.target.y()
  rect.rotation = e.target.rotation()
  rect.scaleX = e.target.scaleX()
  rect.scaleY = e.target.scaleY()

  // change fill color randomly
  rect.fill = Konva.Util.getRandomColor()
}

const updateTransformer = () => {
  const transformerNode = transformer.value.getNode()
  const stage = transformerNode.getStage()
  const selected = selectedShapeName.value

  const selectedNode = stage.findOne('.' + selected)
  // do nothing if selected node is already attached
  if (selectedNode === transformerNode.node()) {
    return
  }

  if (selectedNode) {
    // attach to selected node
    transformerNode.nodes([selectedNode])
  } else {
    // remove transformer
    transformerNode.nodes([])
  }
}

const handleStageMouseDown = (e) => {
  // clicked on stage - clear selection
  if (e.target === e.target.getStage()) {
    selectedShapeName.value = ''
    updateTransformer()
    return
  }

  // clicked on transformer - do nothing
  const clickedOnTransformer = e.target.getParent().className === 'Transformer'
  if (clickedOnTransformer) {
    return
  }

  // find clicked rect by its name
  const name = e.target.name()
  const rect = rectangles.value.find((r) => r.name === name)
  if (rect) {
    selectedShapeName.value = name
  } else {
    selectedShapeName.value = ''
  }
  updateTransformer()
}
</script>
