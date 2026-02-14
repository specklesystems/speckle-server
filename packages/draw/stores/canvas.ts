import { CameraController } from '@speckle/viewer'
import { defineStore } from 'pinia'
import type { Vector3 } from 'three'
import type {
  AdaptiveContainer,
  Shape,
  Snapshot,
  Paper,
  ViewerContainer,
  PaperMode
} from '../lib/paper'

import { useViewerStore } from '../stores/sharedViewer'
import { getUniqueId } from '../utils/index'

export type Tools =
  | 'viewer'
  | 'select'
  | 'rect'
  | 'circle'
  | 'freehand'
  | 'eraser'
  | 'arrow'
  | 'line'
  | 'polyline'
  | 'text'

export type LineType = {
  kind: LineKind
  values: number[]
}

export type LineKind = 'straight' | 'dashed' | 'dashedAndDotted'

export const LineTypes = [
  {
    kind: 'straight',
    values: [1]
  },
  {
    kind: 'dashed',
    values: [10, 5]
  },
  {
    kind: 'dashedAndDotted',
    values: [29, 20, 0.001, 20]
  }
] as LineType[]

export const useCanvasStore = defineStore('canvas', () => {
  const viewerStore = useViewerStore()
  const activePaperId = ref<string | undefined>()
  const papers = ref([] as Array<Paper>)

  const selectedLineType = ref<LineKind>('dashed')

  const lineTypes = [
    {
      kind: 'straight',
      values: [1]
    },
    {
      kind: 'dashed',
      values: [20, 20]
    },
    {
      kind: 'dashedAndDotted',
      values: [29, 20, 0.001, 20]
    }
  ] as LineType[]

  const shapes = ref([] as Array<Shape>)

  const selectedIds = ref<string[]>([])
  const currentTool = ref<Tools>('select')

  const eraserWidth = ref(20)

  const brushSize = ref(6)
  const showThickness = ref(false)
  const showLineType = ref(false)
  const defaultStrokeColor = ref('#000000')
  const currentStrokeColor = ref(defaultStrokeColor.value)
  const currentFillColor = ref('transparent')

  const viewerMode = ref(true)

  const history = shallowRef<Array<Array<Shape>>>([])
  const redoStack = shallowRef<Array<Array<Shape>>>([])

  const cursorType = computed(() => {
    if (currentTool.value === 'text') {
      return 'cursor-text'
    } else if (['line', 'polyline', 'freehand', 'arrow'].includes(currentTool.value)) {
      return 'cursor-crosshair'
    } else {
      return ''
    }
  })

  const setColorMode = (mode: 'dark' | 'light') => {
    defaultStrokeColor.value = mode === 'dark' ? '#ffffff' : '#000000'
    currentStrokeColor.value = defaultStrokeColor.value
  }

  const createPaper = async (
    id: string,
    mode: PaperMode,
    width: number,
    height: number
  ) => {
    // const snapshotId = getUniqueId()
    // const liveSnapshot = { id: snapshotId, shapes: [], name: 'Live' }
    const paper = {
      id,
      name: 'New Paper',
      version: 1,
      width,
      height,
      mode,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewerContainers: [],
      shapes: []
    } as Paper
    papers.value.push(paper)
    activePaperId.value = id
    saveToStorage(id)
  }

  const getActivePaper = () => {
    if (!activePaperId.value) return undefined
    return getPaper(activePaperId.value)
  }

  const getPaper = (id: string) => {
    return papers.value.find((paper) => paper.id === id)
  }

  const updatePaperSize = (id: string, size: { w: number; h: number }) => {
    const paper = getPaper(id)
    if (!paper) return

    paper.width = size.w
    paper.height = size.h

    if (paper.mode === 'adaptive') {
      const viewerContainer = paper.viewerContainers[0] // hacky and i do not like too much
      if (!viewerContainer) return

      updateViewerContainerSize(
        viewerContainer.id,
        { x: 0, y: 0, width: size.w, height: size.h },
        true
      )
    }

    paper.updatedAt = new Date()
  }

  const createViewerContainer = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const paper = getActivePaper()
    if (!paper) return undefined

    const snapshotId = getUniqueId()
    const liveSnapshot = { id: snapshotId, shapes: [], name: 'Live' }
    const adaptiveContainer = {
      id,
      name: 'New Viewer Container',
      version: 1,
      baseWidth: width,
      baseHeight: height,
      width: width,
      height: height,
      createdAt: new Date(),
      updatedAt: new Date(),
      activeSnapshotId: snapshotId,
      liveSnapshot,
      snapshots: []
    } as AdaptiveContainer

    const viewerContainer = {
      id,
      x,
      y,
      mode: 'draw',
      modelUrl: undefined,
      adaptiveContainer,
      snapshotViewerConfigMap: {}
    } as ViewerContainer

    paper.viewerContainers.push(viewerContainer)
    saveToStorage(id)
  }

  // for proper scaling of shapes when paper size changes
  // i am not fully happy about it, but it works for now
  const updateViewerContainerSize = (
    viewerContainerId: string,
    size: { x: number; y: number; width: number; height: number },
    forceSave: boolean = false
  ) => {
    const paper = getActivePaper()
    if (!paper) return

    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return

    viewerContainer.adaptiveContainer.width = size.width
    viewerContainer.adaptiveContainer.height = size.height
    viewerContainer.x = size.x
    viewerContainer.y = size.y

    viewerContainer.adaptiveContainer.updatedAt = new Date()

    viewerContainer.adaptiveContainer.snapshots.forEach((snapshot) => {
      snapshot.shapes.forEach((shape) => {
        shape.currentContainerWidth = size.width
        shape.currentContainerHeight = size.height
      })
    })

    viewerContainer.adaptiveContainer.liveSnapshot.shapes.forEach((shape) => {
      shape.currentContainerWidth = size.width
      shape.currentContainerHeight = size.height
    })

    if (forceSave) saveToStorage(activePaperId.value)
  }

  const toggleViewerMode = (viewerContainerId: string) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return

    viewerContainer.mode = viewerContainer.mode === 'draw' ? 'viewer' : 'draw'
    saveToStorage(activePaperId.value)
  }

  const loadModelIntoViewer = (viewerContainerId: string, modelUrl: string) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return

    viewerContainer.modelUrl = modelUrl
    saveToStorage(activePaperId.value)
  }

  // TODO: fix history!!
  const pushHistory = (paperId: string) => {
    const paper = getPaper(paperId)
    if (!paper) return
    history.value.push(JSON.parse(JSON.stringify(paper.shapes)))
    if (history.value.length > 50) history.value.shift() // limit history
    redoStack.value = [] // clear redo on new action
  }

  const undo = (paperId: string) => {
    if (history.value.length === 0) return
    const paper = getPaper(paperId)
    if (!paper) return
    redoStack.value.push(JSON.parse(JSON.stringify(paper.shapes)))
    const prev = history.value.pop()
    if (prev) {
      paper.shapes.splice(0, paper.shapes.length, ...prev)
      saveToStorage(paperId)
    }
  }

  const redo = (paperId: string) => {
    if (redoStack.value.length === 0) return
    const paper = getPaper(paperId)
    if (!paper) return
    history.value.push(JSON.parse(JSON.stringify(v.shapes)))
    const next = redoStack.value.pop()
    if (next) {
      paper.shapes.splice(0, paper.shapes.length, ...next)
      saveToStorage(paperId)
    }
  }

  const saveToStorage = (paperId: string) => {
    const paper = papers.value.find((p) => p.id === paperId)
    if (!paper) return
    localStorage.setItem(`speckle-draw-paper-${paperId}`, JSON.stringify(paper))
  }

  const loadFromStorage = () => {
    if (typeof window === 'undefined') return
    papers.value = Object.entries(localStorage)
      .filter((entry) => entry[0].includes('speckle-draw-paper-'))
      .map((entry) => JSON.parse(entry[1]))
  }

  const addShape = (paperId: string, shape: Shape, viewerContainerId?: string) => {
    pushHistory(paperId)
    const paper = papers.value.find((p) => p.id === paperId)
    if (!paper) return

    const shapeToAdd = {
      ...shape,
      rotation: 0,
      strokeColor: currentStrokeColor.value
    } as Shape

    if (viewerContainerId) {
      const viewerContainer = getViewerContainer(viewerContainerId)
      if (!viewerContainer) return

      const bakedShape = bakeShapeToContainer(shapeToAdd, viewerContainer)
      viewerContainer.adaptiveContainer.liveSnapshot.shapes.push(bakedShape)
    } else {
      // stays in world coords
      paper.shapes.push(shapeToAdd)
    }

    saveToStorage(paperId)
  }

  const bakeShapeToContainer = (shape: Shape, container: ViewerContainer): Shape => {
    switch (shape.type) {
      case 'freehand':
        return {
          ...shape,
          points: shape.points.map((val, i) =>
            i % 2 === 0 ? val - container.x : val - container.y
          )
        }
      case 'polyline':
        return {
          ...shape,
          points: shape.points.map((val, i) =>
            i % 2 === 0 ? val - container.x : val - container.y
          )
        }
      case 'arrow':
        return {
          ...shape,
          points: shape.points.map((val, i) =>
            i % 2 === 0 ? val - container.x : val - container.y
          )
        }
      case 'text':
        return {
          ...shape,
          x: shape.x - container.x,
          y: shape.y - container.y
        }
      default:
        return {
          ...shape
        }
    }
  }

  function bakeToContainerCoords(
    points: number[],
    container: ViewerContainer
  ): number[] {
    return points.map((val, i) => (i % 2 === 0 ? val - container.x : val - container.y))
  }

  const updateShape = (
    paperId: string,
    viewerContainerId: string,
    id: string,
    attrs: any
  ) => {
    pushHistory(paperId)
    const activeSnapshot = getActiveSnapshot(viewerContainerId)
    if (!activeSnapshot) return

    const shape = activeSnapshot?.shapes.find((s) => s.id === id)
    if (shape) Object.assign(shape, attrs)
    saveToStorage(paperId)
  }

  const selectShapes = (ids: string[]) => {
    selectedIds.value = selectedIds.value.concat(ids)
    setTool('select')
  }

  const deselectShapes = () => {
    selectedIds.value = []
    setTool('select')
  }

  const getShape = (paperId: string, viewerContainerId: string, shapeId: string) => {
    const activeSnapshot = getActiveSnapshot(viewerContainerId)
    if (!activeSnapshot) return undefined
    return activeSnapshot.shapes.find((s) => s.id === shapeId)
  }

  const setTool = (tool: Tools) => {
    currentTool.value = tool
    console.log(currentTool.value)
  }

  const deleteShapes = (paperId: string, viewerContainerId: string, ids: string[]) => {
    pushHistory(paperId)
    if (!ids) return
    const activeSnapshot = getActiveSnapshot(viewerContainerId)
    if (activeSnapshot?.shapes.length === 0) return
    for (let i = activeSnapshot?.shapes.length - 1; i >= 0; i--) {
      if (ids.includes(activeSnapshot?.shapes[i].id)) {
        activeSnapshot?.shapes.splice(i, 1)
      }
    }
    selectedIds.value = []
    saveToStorage(paperId)
  }

  const clearShapes = (paperId: string, viewerContainerId: string) => {
    const activeSnapshot = getActiveSnapshot(viewerContainerId)
    activeSnapshot?.shapes?.splice(0)
    saveToStorage(paperId)
  }

  const getViewerContainer = (viewerContainerId: string) => {
    const paper = getActivePaper()
    if (!paper) return undefined

    const viewerContainer = paper.viewerContainers.find(
      (v) => v.id === viewerContainerId
    )
    if (!viewerContainer) return undefined

    return viewerContainer
  }

  const getActiveSnapshot = (viewerContainerId: string) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return undefined
    return viewerContainer.adaptiveContainer.activeSnapshotId ===
      viewerContainer.adaptiveContainer.liveSnapshot.id
      ? viewerContainer.adaptiveContainer.liveSnapshot
      : viewerContainer.adaptiveContainer.snapshots.find(
          (s) => s.id === viewerContainer.adaptiveContainer.activeSnapshotId
        )
  }

  const setActiveSnapshot = (
    paperId: string,
    viewerContainerId: string,
    snapshotId: string
  ) => {
    const viewer = getViewerContainer(viewerContainerId)
    if (!viewer) return undefined

    viewer.adaptiveContainer.activeSnapshotId = snapshotId
    saveToStorage(paperId)
  }

  const removeSnapshot = async (
    paperId: string,
    viewerContainerId: string,
    snapshotId: string
  ) => {
    const viewer = getViewerContainer(viewerContainerId)
    if (!viewer) return undefined
    viewer.adaptiveContainer.snapshots = viewer.adaptiveContainer.snapshots.filter(
      (s) => s.id !== snapshotId
    )
    saveToStorage(paperId)
  }

  const getSnapshots = (paperId: string, viewerContainerId: string) => {
    const viewer = getViewerContainer(viewerContainerId)
    if (!viewer) return undefined
    return [
      viewer.adaptiveContainer.liveSnapshot,
      ...viewer.adaptiveContainer.snapshots
    ]
  }

  const saveSnapshot = async (
    paperId: string,
    viewerContainerId: string,
    name: string
  ) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return undefined

    const viewer = viewerStore.getViewer(paperId)
    let camera
    if (viewer) {
      const cameraController = viewer?.getExtension(CameraController)
      const position = cameraController?.getPosition()
      const target = cameraController?.getTarget()
      camera = {
        position: {
          x: position.x as number,
          y: position.y as number,
          z: position.z as number
        },
        target: {
          x: target.x as number,
          y: target.y as number,
          z: target.z as number
        },
        isometric: false // TODO later
      }
    }

    // TODO: proxify later if borks the performance
    const shapesDeepCopy = viewerContainer?.adaptiveContainer.liveSnapshot.shapes
      ? JSON.parse(
          JSON.stringify(viewerContainer.adaptiveContainer.liveSnapshot.shapes)
        )
      : []

    const snapshotId = getUniqueId()

    const snapshot: Snapshot = {
      id: snapshotId,
      name: name || 'Untitled',
      shapes: shapesDeepCopy
    }

    viewerContainer.snapshotViewerConfigMap[snapshotId] = {
      camera
    }

    viewerContainer?.adaptiveContainer.snapshots.push(snapshot)
    saveToStorage(paperId)
  }

  const setCameraPosition = (
    viewerContainerId: string,
    position: Vector3,
    target: Vector3
  ) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return

    const viewer = viewerStore.getViewer(viewerContainerId)
    if (!viewer) return

    const camera = {
      position: {
        x: position.x as number,
        y: position.y as number,
        z: position.z as number
      },
      target: {
        x: target.x as number,
        y: target.y as number,
        z: target.z as number
      },
      isometric: false // TODO later
    }

    const activeSnapshot = getActiveSnapshot(viewerContainerId)
    if (!activeSnapshot) return

    viewerContainer.snapshotViewerConfigMap[activeSnapshot.id] = {
      camera
    }

    saveToStorage(activePaperId.value)
  }

  const setModelUrl = async (
    paperId: string,
    viewerContainerId: string,
    url: string
  ) => {
    const viewerContainer = getViewerContainer(viewerContainerId)
    if (!viewerContainer) return

    viewerContainer.modelUrl = url
    saveToStorage(paperId)
  }

  const renamePaper = async (paperId: string, newName: string) => {
    const paper = papers.value.find((p) => p.id === paperId)
    if (!paper) return
    paper.name = newName
    saveToStorage(paperId)
  }

  const duplicatePaper = async (paperId: string) => {
    const id = getUniqueId()

    const paper = papers.value.find((p) => p.id === paperId)
    if (!paper) return

    const newPaper = JSON.parse(JSON.stringify(paper))

    newPaper.id = id
    newPaper.name = `${paper.name} (copy)`

    papers.value.push(newPaper)
    saveToStorage(id)
  }

  const deletePaper = async (id: string) => {
    papers.value = papers.value.filter((p) => p.id !== id)
    localStorage.removeItem(`speckle-draw-paper-${id}`)
  }

  const setLiveSnapshotThumb = (paperId: string, dataUrl: string) => {
    const paper = papers.value.find((p) => p.id === paperId)
    if (!paper) return
    paper.thumbnailUrl = dataUrl
    paper.updatedAt = new Date()
    saveToStorage?.(paperId)
  }

  // init from storage
  void loadFromStorage()

  return {
    setColorMode,
    cursorType,
    activePaperId,
    getActivePaper,
    papers,
    createPaper,
    createViewerContainer,
    getPaper,
    updatePaperSize,
    loadModelIntoViewer,
    toggleViewerMode,
    updateViewerContainerSize,
    getViewerContainer,
    deletePaper,
    duplicatePaper,
    renamePaper,
    saveSnapshot,
    setCameraPosition,
    setLiveSnapshotThumb,
    getActiveSnapshot,
    setActiveSnapshot,
    removeSnapshot,
    getSnapshots,
    viewerMode,
    setModelUrl,
    shapes,
    selectedIds,
    currentTool,
    defaultStrokeColor,
    currentStrokeColor,
    currentFillColor,
    brushSize,
    selectedLineType,
    lineTypes,
    showThickness,
    showLineType,
    saveToStorage,
    loadFromStorage,
    addShape,
    updateShape,
    selectShapes,
    deselectShapes,
    getShape,
    setTool,
    deleteShapes,
    clearShapes,
    undo,
    redo
  }
})
