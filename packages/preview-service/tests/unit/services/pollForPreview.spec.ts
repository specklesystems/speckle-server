import { logger } from '@/observability/logging.js'
import { pollForAndCreatePreviewFactory } from '@/services/pollForPreview.js'
import { describe, expect, it } from 'vitest'

describe.concurrent('Polling for preview', () => {
  describe.concurrent('pollForAndCreatePreview', () => {
    it('calls all component functions with expected parameters', async () => {
      const called: Record<string, number> = {}
      const pollForAndCreatePreview = pollForAndCreatePreviewFactory({
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
        logger
      })

      await pollForAndCreatePreview()
      expect(called['updateHealthcheckData']).toBeGreaterThanOrEqual(1)
      expect(called['generateAndStore360Preview']).toBeGreaterThanOrEqual(1)
      expect(called['updatePreviewMetadata']).toBeGreaterThanOrEqual(1)
      expect(called['notifyUpdate']).toBeGreaterThanOrEqual(1)
    })
  })
})
