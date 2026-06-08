export type PaperMode = 'infinite' | 'adaptive'

export type Paper = {
  id: string
  version: number
  name: string
  createdAt: Date
  updatedAt: Date
  width: number
  height: number
  mode: PaperMode
  viewerContainers: ViewerContainer[]
  shapes: Shape[]
  thumbnailUrl?: string
}

export type ViewerConfig = {
  camera?: {
    position: {
      x: number
      y: number
      z: number
    }
    target: {
      x: number
      y: number
      z: number
    }
    isometric: boolean
  }
}

// Exists mostly for separation of concerns for usage only viewer container or viewer container in paper
export type ViewerContainer = {
  id: string
  // x coordinate the container in the paper
  x: number
  // y coordinate of the container in the paper
  y: number
  mode: 'viewer' | 'draw'
  modelUrl?: string
  adaptiveContainer: AdaptiveContainer
  snapshotViewerConfigMap: Record<string, ViewerConfig>
}

export type AdaptiveContainer = {
  id: string
  name: string
  width: number
  height: number
  baseWidth: number
  baseHeight: number
  createdAt: Date
  updatedAt: Date
  activeSnapshotId: string
  liveSnapshot: Snapshot
  snapshots: Snapshot[]
}

// TODO: have proper types for each shape types instead many nullables
export type Shape = {
  id: string
  type: string
  x: number
  y: number
  containerWidthOnCreate?: number
  containerHeightOnCreate?: number
  currentContainerWidth?: number
  currentContainerHeight?: number
  points?: number[]
  rotation?: number
  scaleX?: number
  scaleY?: number
  width?: number
  height?: number
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  text?: string
  align?: 'left' | 'center' | 'right'
  dash?: number[]
}

export type FreehandShape = {
  points: number[]
  trace: [number[]]
} & Shape

export type Snapshot = {
  id: string
  name: string
  shapes: Shape[]
  thumbUrl?: string
}
