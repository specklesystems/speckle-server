import { intersection, isObjectLike } from 'lodash'
import { MaybeNullOrUndefined, Nullable } from '../../core/helpers/utilityTypes'

export const SERIALIZED_VIEWER_STATE_VERSION = 1.2

export type SerializedViewerState = {
  projectId: string
  sessionId: string
  viewer: {
    metadata: {
      filteringState: Nullable<{
        passMin?: MaybeNullOrUndefined<number>
        passMax?: MaybeNullOrUndefined<number>
      }>
    }
  }
  resources: {
    request: {
      resourceIdString: string
      threadFilters: {
        includeArchived?: MaybeNullOrUndefined<boolean>
        loadedVersionsOnly?: MaybeNullOrUndefined<boolean>
      }
    }
  }
  ui: {
    threads: {
      openThread: {
        threadId: Nullable<string>
        isTyping: boolean
        newThreadEditor: boolean
      }
    }
    diff: {
      diffString: Nullable<string>
      diffTime: number
      diffMode: number
    }
    spotlightUserSessionId: Nullable<string>
    filters: {
      isolatedObjectIds: string[]
      hiddenObjectIds: string[]
      selectedObjectIds: string[]
      propertyFilter: {
        key: Nullable<string>
        isApplied: boolean
      }
    }
    camera: {
      position: number[]
      target: number[]
      isOrthoProjection: boolean
      zoom: number
    }
    sectionBox: Nullable<{
      min: number[]
      max: number[]
    }>
    lightConfig: {
      intensity?: number
      indirectLightIntensity?: number
      elevation?: number
      azimuth?: number
    }
    explodeFactor: number
    selection: Nullable<number[]>
  }
}

// TODO: Improve validation here so we don't save malformed states in DB
export const isSerializedViewerState = (val: unknown): val is SerializedViewerState => {
  if (!val) return false
  const keys: Array<keyof SerializedViewerState> = [
    'projectId',
    'sessionId',
    'resources',
    'ui',
    'viewer'
  ]
  if (!isObjectLike(val)) return false

  const valKeys = Object.keys(val as Record<string, unknown>)
  if (intersection(valKeys, keys).length !== keys.length) return false

  return true
}

/**
 * Formats SerializedViewerState by bringing it up to date with the structure of the latest version
 */
export const formatSerializedViewerState = (
  state: SerializedViewerState
): SerializedViewerState => {
  /**
   * v1 -> v1.1
   * - ui.filters.propertyFilter.isApplied field added
   * - ui.spotlightUserId swapped for spotlightUserSessionId
   */
  if (!state.ui.filters.propertyFilter.isApplied) {
    state.ui.filters.propertyFilter.isApplied = false
  }

  if (!state.ui.spotlightUserSessionId) {
    state.ui.spotlightUserSessionId = null
  }

  /**
   * v1.1 -> v1.2
   * - ui.diff added
   */
  if (!state.ui.diff) {
    state.ui.diff = {
      diffMode: 1,
      diffString: null,
      diffTime: 0.5
    }
  }

  return state
}
