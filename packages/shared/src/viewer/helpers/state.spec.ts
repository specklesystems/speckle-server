/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect } from 'vitest'
import {
  formatSerializedViewerState,
  inputToVersionedState,
  isSerializedViewerState,
  isVersionedSerializedViewerState,
  SERIALIZED_VIEWER_STATE_VERSION,
  SerializedViewerState,
  VersionedSerializedViewerState
} from './state.js'
import { UnformattableSerializedViewerStateError } from '../errors/index.js'

describe('Viewer State helpers', () => {
  describe('isSerializedViewerState', () => {
    it('returns true for valid SerializedViewerState', () => {
      const valid: SerializedViewerState = {
        projectId: 'pid',
        sessionId: 'sid',
        viewer: { metadata: { filteringState: null } },
        resources: {
          request: {
            resourceIdString: 'rid',
            threadFilters: {}
          }
        },
        ui: {
          threads: {
            openThread: { threadId: null, isTyping: false, newThreadEditor: false }
          },
          diff: { command: null, time: 0, mode: 1 },
          spotlightUserSessionId: null,
          filters: {
            isolatedObjectIds: [],
            hiddenObjectIds: [],
            selectedObjectApplicationIds: {},
            propertyFilters: [],
            activeColorFilterId: null,
            filterLogic: 'all'
          },
          camera: {
            position: [0, 0, 0],
            target: [0, 0, 0],
            isOrthoProjection: false,
            zoom: 1
          },
          viewMode: {
            mode: 0,
            edgesColor: 0,
            edgesEnabled: true,
            outlineOpacity: 0,
            edgesWeight: 0
          },
          sectionBox: null,
          lightConfig: {},
          explodeFactor: 0,
          selection: null,
          measurement: { enabled: false, options: null, measurements: [] }
        }
      }
      expect(isSerializedViewerState(valid)).toBe(true)
    })

    it('returns false for missing keys', () => {
      expect(isSerializedViewerState({})).toBe(false)
      expect(isSerializedViewerState(null)).toBe(false)
      expect(isSerializedViewerState(undefined)).toBe(false)
      expect(isSerializedViewerState({ projectId: 'pid' })).toBe(false)
    })

    it('returns false for non-object values', () => {
      expect(isSerializedViewerState(123)).toBe(false)
      expect(isSerializedViewerState('string')).toBe(false)
      expect(isSerializedViewerState([])).toBe(false)
    })
  })

  describe('formatSerializedViewerState', () => {
    it('fills missing optional fields with defaults', () => {
      const partial = {
        projectId: 'pid',
        viewer: { metadata: {} },
        resources: { request: { resourceIdString: 'rid' } },
        ui: {
          camera: { position: [1, 2, 3], target: [4, 5, 6] }
        }
      }
      const formatted = formatSerializedViewerState(partial as any)
      expect(formatted.projectId).toBe('pid')
      expect(formatted.sessionId).toMatch(/nullSessionId-/)
      expect(formatted.ui.camera.position).toEqual([1, 2, 3])
      expect(formatted.ui.camera.target).toEqual([4, 5, 6])
      expect(formatted.ui.measurement.options?.units).toBe('m')
      expect(formatted.ui.filters.selectedObjectApplicationIds).toEqual({})
    })

    it('throws UnformattableSerializedViewerStateError for missing required fields', () => {
      expect(() => formatSerializedViewerState({} as any)).toThrow(
        UnformattableSerializedViewerStateError
      )
      expect(() =>
        formatSerializedViewerState({
          projectId: 'pid',
          viewer: { metadata: {} },
          resources: { request: { resourceIdString: 'rid' } },
          ui: { camera: { target: [1, 2, 3] } }
        } as any)
      ).toThrow(UnformattableSerializedViewerStateError)
    })

    it('handles legacy selectedObjectIds', () => {
      const partial = {
        projectId: 'pid',
        viewer: { metadata: {} },
        resources: { request: { resourceIdString: 'rid' } },
        ui: {
          camera: { position: [1, 2, 3], target: [4, 5, 6] },
          filters: { selectedObjectIds: ['a', 'b'] }
        }
      }
      const formatted = formatSerializedViewerState(partial as any)
      expect(formatted.ui.filters.selectedObjectApplicationIds).toEqual({
        a: null,
        b: null
      })
    })
  })

  describe('inputToVersionedState', () => {
    it('returns versioned state for valid input', () => {
      const valid: SerializedViewerState = {
        projectId: 'pid',
        sessionId: 'sid',
        viewer: { metadata: { filteringState: null } },
        resources: {
          request: {
            resourceIdString: 'rid',
            threadFilters: {}
          }
        },
        ui: {
          threads: {
            openThread: { threadId: null, isTyping: false, newThreadEditor: false }
          },
          diff: { command: null, time: 0, mode: 1 },
          spotlightUserSessionId: null,
          filters: {
            isolatedObjectIds: [],
            hiddenObjectIds: [],
            selectedObjectApplicationIds: {},
            propertyFilters: [],
            activeColorFilterId: null,
            filterLogic: 'all'
          },
          camera: {
            position: [0, 0, 0],
            target: [0, 0, 0],
            isOrthoProjection: false,
            zoom: 1
          },
          viewMode: {
            mode: 0,
            edgesColor: 0,
            edgesEnabled: true,
            outlineOpacity: 0,
            edgesWeight: 0
          },
          sectionBox: null,
          lightConfig: {},
          explodeFactor: 0,
          selection: null,
          measurement: { enabled: false, options: null, measurements: [] }
        }
      }
      const result = inputToVersionedState(valid)
      expect(result).not.toBeNull()
      expect(result?.version).toBe(SERIALIZED_VIEWER_STATE_VERSION)
      expect(result?.state.projectId).toBe('pid')
    })

    it('returns null for invalid input', () => {
      expect(inputToVersionedState(null)).toBeNull()
      expect(inputToVersionedState({})).toBeNull()
      expect(inputToVersionedState(123)).toBeNull()
    })
  })

  describe('isVersionedSerializedViewerState', () => {
    it('returns true for valid VersionedSerializedViewerState', () => {
      const valid: VersionedSerializedViewerState = {
        version: SERIALIZED_VIEWER_STATE_VERSION,
        state: {
          projectId: 'pid',
          sessionId: 'sid',
          viewer: { metadata: { filteringState: null } },
          resources: {
            request: {
              resourceIdString: 'rid',
              threadFilters: {}
            }
          },
          ui: {
            threads: {
              openThread: { threadId: null, isTyping: false, newThreadEditor: false }
            },
            diff: { command: null, time: 0, mode: 1 },
            spotlightUserSessionId: null,
            filters: {
              isolatedObjectIds: [],
              hiddenObjectIds: [],
              selectedObjectApplicationIds: {},
              propertyFilters: [],
              activeColorFilterId: null,
              filterLogic: 'all'
            },
            camera: {
              position: [0, 0, 0],
              target: [0, 0, 0],
              isOrthoProjection: false,
              zoom: 1
            },
            viewMode: {
              mode: 0,
              edgesColor: 0,
              edgesEnabled: true,
              outlineOpacity: 0,
              edgesWeight: 0
            },
            sectionBox: null,
            lightConfig: {},
            explodeFactor: 0,
            selection: null,
            measurement: { enabled: false, options: null, measurements: [] }
          }
        }
      }
      expect(isVersionedSerializedViewerState(valid)).toBe(true)
    })

    it('returns false for missing version or state', () => {
      expect(isVersionedSerializedViewerState({})).toBe(false)
      expect(isVersionedSerializedViewerState({ version: 1 })).toBe(false)
      expect(isVersionedSerializedViewerState({ state: {} })).toBe(false)
      expect(isVersionedSerializedViewerState(null)).toBe(false)
    })

    it('returns false for invalid state', () => {
      expect(isVersionedSerializedViewerState({ version: 1, state: {} })).toBe(false)
    })
  })
})
