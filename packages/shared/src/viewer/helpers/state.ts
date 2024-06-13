import { intersection, isObjectLike } from '#lodash'
import type { MaybeNullOrUndefined, Nullable } from '../../core/helpers/utilityTypes.js'
import type { PartialDeep } from 'type-fest'
import { UnformattableSerializedViewerStateError } from '../errors/index.js'

enum MeasurementType {
  PERPENDICULAR = 0,
  POINTTOPOINT = 1
}

interface MeasurementOptions {
  visible: boolean
  type?: MeasurementType
  vertexSnap?: boolean
  units?: string
  precision?: number
}

/**
 * v1 -> v1.1
 * - ui.filters.propertyFilter.isApplied field added
 * - ui.spotlightUserId swapped for spotlightUserSessionId
 * v1.1 -> v1.2
 * - ui.diff added
 */
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
      command: Nullable<string>
      time: number
      mode: number
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
    measurement: {
      enabled: boolean
      options: Nullable<MeasurementOptions>
    }
  }
}

type UnformattedState = PartialDeep<SerializedViewerState>

/**
 * Note: This only does superficial validation. To really ensure that all of the keys are there, even if prefilled with default values, make sure you invoke
 * formatSerializedViewerState() on the state afterwards
 */
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

const initializeMissingData = (state: UnformattedState): SerializedViewerState => {
  const throwInvalidError = (missingPath: string): never => {
    throw new UnformattableSerializedViewerStateError(
      'Required data missing from SerializedViewerState: ' + missingPath
    )
  }

  const defaultMeasurementOptions: MeasurementOptions = {
    visible: false,
    type: MeasurementType.POINTTOPOINT,
    vertexSnap: false,
    units: 'm',
    precision: 2
  }

  const measurementOptions = {
    ...defaultMeasurementOptions,
    ...state.ui?.measurement?.options
  }

  return {
    projectId: state.projectId || throwInvalidError('projectId'),
    sessionId: state.sessionId || `nullSessionId-${Math.random() * 1000}`,
    viewer: {
      ...(state.viewer || {}),
      metadata: {
        ...(state.viewer?.metadata || {}),
        filteringState: state.viewer?.metadata?.filteringState || null
      }
    },
    resources: {
      ...(state.resources || {}),
      request: {
        ...(state.resources?.request || {}),
        resourceIdString:
          state.resources?.request?.resourceIdString ||
          throwInvalidError('resources.request.resourceIdString'),
        threadFilters: {
          ...(state.resources?.request?.threadFilters || {}),
          includeArchived:
            state.resources?.request?.threadFilters?.includeArchived || false,
          loadedVersionsOnly:
            state.resources?.request?.threadFilters?.loadedVersionsOnly || false
        }
      }
    },
    ui: {
      ...(state.ui || {}),
      threads: {
        ...(state.ui?.threads || {}),
        openThread: {
          ...(state.ui?.threads?.openThread || {}),
          threadId: state.ui?.threads?.openThread?.threadId || null,
          isTyping: state.ui?.threads?.openThread?.isTyping || false,
          newThreadEditor: state.ui?.threads?.openThread?.newThreadEditor || false
        }
      },
      diff: {
        ...(state.ui?.diff || {}),
        command: state.ui?.diff?.command || null,
        time: state.ui?.diff?.time || 0.5,
        mode: state.ui?.diff?.mode || 1
      },
      spotlightUserSessionId: state.ui?.spotlightUserSessionId || null,
      filters: {
        ...(state.ui?.filters || {}),
        isolatedObjectIds: state.ui?.filters?.isolatedObjectIds || [],
        hiddenObjectIds: state.ui?.filters?.hiddenObjectIds || [],
        selectedObjectIds: state.ui?.filters?.selectedObjectIds || [],
        propertyFilter: {
          ...(state.ui?.filters?.propertyFilter || {}),
          key: state.ui?.filters?.propertyFilter?.key || null,
          isApplied: state.ui?.filters?.propertyFilter?.isApplied || false
        }
      },
      camera: {
        ...(state.ui?.camera || {}),
        position: state.ui?.camera?.position || throwInvalidError('ui.camera.position'),
        target: state.ui?.camera?.target || throwInvalidError('ui.camera.target'),
        isOrthoProjection: state.ui?.camera?.isOrthoProjection || false,
        zoom: state.ui?.camera?.zoom || 1
      },
      sectionBox:
        state.ui?.sectionBox?.min?.length && state.ui?.sectionBox.max?.length
          ? {
              min: state.ui.sectionBox.min,
              max: state.ui.sectionBox.max
            }
          : null,
      lightConfig: {
        ...(state.ui?.lightConfig || {}),
        intensity: state.ui?.lightConfig?.intensity,
        indirectLightIntensity: state.ui?.lightConfig?.indirectLightIntensity,
        elevation: state.ui?.lightConfig?.elevation,
        azimuth: state.ui?.lightConfig?.azimuth
      },
      explodeFactor: state.ui?.explodeFactor || 0,
      selection: state.ui?.selection || null,
      measurement: {
        enabled: state.ui?.measurement?.enabled ?? false,
        options: measurementOptions
      }
    }
  }
}

/**
 * Formats SerializedViewerState by bringing it up to date with the structure of the latest version
 * and ensuring missing keys are initialized with default values
 */
export const formatSerializedViewerState = (
  state: UnformattedState
): SerializedViewerState => {
  const finalState = initializeMissingData(state)
  return finalState
}
