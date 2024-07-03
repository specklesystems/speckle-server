import { logger } from '@/observability/logging.js'
import { repeatedlyPollForWorkFactory } from '@/services/taskManager.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Task Manager', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  describe('repeatedly poll for work', () => {
    it.skip('runs at least once', () => {
      const called: Record<string, number> = {}
      const repeatedlyPollForWork = repeatedlyPollForWorkFactory({
        updateHealthcheckData: () => {
          called['updateHealthcheckData'] = called['updateHealthcheckData']++ || 1
        },
        getNextUnstartedObjectPreview: async () =>
          Promise.resolve({
            streamId: 'streamId',
            objectId: 'objectId'
          }),
        generateAndStore360Preview: async (task) => {
          called['generateAndStore360Preview'] =
            called['generateAndStore360Preview']++ || 1
          expect(task).toEqual({ streamId: 'streamId', objectId: 'objectId' })
          return Promise.resolve({ metadata: { all: 'myJoinedUpPreviewId' } })
        },
        updatePreviewMetadata: async (params) => {
          called['updatePreviewMetadata'] = called['updatePreviewMetadata']++ || 1
          expect(params).toEqual({
            metadata: { all: 'myJoinedUpPreviewId' },
            streamId: 'streamId',
            objectId: 'objectId'
          })
          return Promise.resolve()
        },
        notifyUpdate: async (task) => {
          called['notifyUpdate'] = called['notifyUpdate']++ || 1
          expect(task).toEqual({ streamId: 'streamId', objectId: 'objectId' })
          return Promise.resolve()
        },
        onExit: () => {
          called['onExit'] = called['onExit']++ || 1
        },
        logger
      })

      repeatedlyPollForWork()
      expect(called['updateHealthcheckData']).toBeGreaterThanOrEqual(1)
      expect(called['generateAndStore360Preview']).toBeGreaterThanOrEqual(1)
      expect(called['updatePreviewMetadata']).toBeGreaterThanOrEqual(1)
      expect(called['notifyUpdate']).toBeGreaterThanOrEqual(1)
      expect(called['onExit']).toBe(0)
    })
  })
})
