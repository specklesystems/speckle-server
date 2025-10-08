import { expect } from 'chai'
import { responseHandlerFactory } from '@/modules/previews/services/responses'
import { buildConsumePreviewResult } from '@/modules/previews/resultListener'
import cryptoRandomString from 'crypto-random-string'
import { logger } from '@/observability/logging'

describe('object preview @previews', () => {
  describe('responseHandlerFactory creates a function, that', () => {
    beforeEach(() => {})
    it('gracefully handles a response for a non-existent (e.g. deleted in meantime) project', async () => {
      const handleResponse = responseHandlerFactory({
        observeMetrics: () => {},
        logger,
        consumePreviewResultBuilder: buildConsumePreviewResult
      })
      let doneCalled = false
      let doneErr: Error | null | undefined = null
      await expect(
        handleResponse(
          {
            data: {
              jobId: `${cryptoRandomString({ length: 10 })}.${cryptoRandomString({
                length: 10
              })}`,
              status: 'success',
              result: {
                durationSeconds: 0,
                loadDurationSeconds: 0,
                renderDurationSeconds: 0,
                screenshots: {
                  '0': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII'
                }
              }
            },
            attemptsMade: 0
          },
          (err) => {
            doneCalled = true
            doneErr = err
          }
        )
      ).eventually.be.fulfilled
      expect(doneCalled).to.be.true
      expect(doneErr).to.be.undefined
    })
  })
})
