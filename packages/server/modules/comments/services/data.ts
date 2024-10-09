import {
  ConvertLegacyDataToState,
  GetViewerResourcesForComments
} from '@/modules/comments/domain/operations'
import { LegacyCommentViewerData } from '@/modules/core/graph/generated/graphql'
import { viewerResourcesToString } from '@/modules/core/services/commit/viewerResources'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { has, get, intersection, isObjectLike } from 'lodash'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

export type LegacyData = Partial<LegacyCommentViewerData>

export type DataStruct = {
  version: number
  state: SerializedViewerState
}

export function inputToDataStruct(
  inputSerializedViewerState: unknown
): Nullable<DataStruct> {
  const state = SpeckleViewer.ViewerState.isSerializedViewerState(
    inputSerializedViewerState
  )
    ? inputSerializedViewerState
    : null
  if (!state) return null

  return {
    version: SpeckleViewer.ViewerState.SERIALIZED_VIEWER_STATE_VERSION,
    state
  }
}

export function isDataStruct(data: unknown): data is DataStruct {
  if (!data) return false
  if (!has(data, 'version')) return false
  const stateRaw = get(data, 'state')
  return SpeckleViewer.ViewerState.isSerializedViewerState(stateRaw)
}

export const formatSerializedViewerState =
  SpeckleViewer.ViewerState.formatSerializedViewerState

export function isLegacyData(data: unknown): data is LegacyData {
  if (!data) return false
  const keys: Array<keyof LegacyData> = [
    'camPos',
    'filters',
    'location',
    'sectionBox',
    'selection'
  ]
  if (!isObjectLike(data)) return false

  const valKeys = Object.keys(data as Record<string, unknown>)
  if (intersection(valKeys, keys).length !== keys.length) return false

  return true
}

export function convertStateToLegacyData(state: SerializedViewerState): LegacyData {
  const camPos = state.ui.camera.position
  const camTarget = state.ui.camera.target
  const zoom = state.ui.camera.zoom
  const isOrtho = state.ui.camera.isOrthoProjection
  const selection = state.ui.selection
  const selectionLocation = selection || camTarget

  const ret: LegacyData = {
    camPos: [
      camPos[0] || 0,
      camPos[1] || 0,
      camPos[2] || 0,
      camTarget[0] || 0,
      camTarget[1] || 0,
      camTarget[2] || 0,
      zoom || 1,
      isOrtho ? 1 : 0
    ],
    filters: {
      passMin: state.viewer.metadata.filteringState?.passMin || null,
      passMax: state.viewer.metadata.filteringState?.passMax || null,
      hiddenIds: state.ui.filters.hiddenObjectIds.slice(),
      isolatedIds: state.ui.filters.isolatedObjectIds.slice(),
      sectionBox: state.ui.sectionBox,
      propertyInfoKey: state.ui.filters.propertyFilter.key
    },
    location: {
      x: selectionLocation[0] || 0,
      y: selectionLocation[1] || 0,
      z: selectionLocation[2] || 0
    },
    sectionBox: state.ui.sectionBox,
    selection: null
  }
  return ret
}

export const convertLegacyDataToStateFactory =
  (deps: {
    getViewerResourcesForComments: GetViewerResourcesForComments
  }): ConvertLegacyDataToState =>
  async (data, comment) => {
    const resources = await deps.getViewerResourcesForComments(comment.streamId, [
      comment.id
    ])
    const sectionBox = data.filters?.sectionBox || data.sectionBox

    const ret: SerializedViewerState = {
      projectId: comment.streamId,
      sessionId: 'legacy-sessionId',
      viewer: {
        metadata: {
          filteringState: {
            passMax: data.filters?.passMax,
            passMin: data.filters?.passMin
          }
        }
      },
      resources: {
        request: {
          resourceIdString: viewerResourcesToString(resources),
          threadFilters: {
            includeArchived: false,
            loadedVersionsOnly: false
          }
        }
      },
      ui: {
        threads: {
          openThread: {
            threadId: null,
            isTyping: false,
            newThreadEditor: true
          }
        },
        spotlightUserSessionId: null,
        explodeFactor: 0,
        filters: {
          isolatedObjectIds: data.filters?.isolatedIds || [],
          hiddenObjectIds: data.filters?.hiddenIds || [],
          selectedObjectIds: [],
          propertyFilter: {
            key: data.filters?.propertyInfoKey || null,
            isApplied: true
          }
        },
        camera: {
          position: [
            data.camPos?.[0] || 0,
            data.camPos?.[1] || 0,
            data.camPos?.[2] || 0
          ],
          target: [data.camPos?.[3] || 0, data.camPos?.[4] || 0, data.camPos?.[5] || 0],
          isOrthoProjection: !!data.camPos?.[6],
          zoom: data.camPos?.[7] || 1
        },
        sectionBox: sectionBox
          ? {
              min: (sectionBox.min as number[]) || [0, 0, 0],
              max: (sectionBox.max as number[]) || [0, 0, 0]
            }
          : null,
        lightConfig: {},
        selection: data.location
          ? [
              data.location.x as number,
              data.location.y as number,
              data.location.z as number
            ]
          : null,
        diff: {
          command: null,
          mode: 1,
          time: 0.5
        },
        measurement: {
          enabled: false,
          options: null
        }
      }
    }
    return ret
  }
