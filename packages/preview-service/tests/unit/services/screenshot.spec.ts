import { LoadPageAndEvaluateScript } from '@/clients/puppeteer.js'
import { logger } from '@/observability/logging.js'
import { getScreenshotFactory } from '@/services/screenshot.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Screenshot', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  describe('with Puppeteer returning a valid responses', () => {
    const loadPageAndEvaluateScript: LoadPageAndEvaluateScript = (
      urlOfObjectToScreenshot
    ) => {
      //NOTE if this expectation fails it won't get explicitly captured by vitest. Instead we get null output from getScreenshot.
      expect(urlOfObjectToScreenshot).toBe(
        'http://localhost:0000/streams/streamId/objects/objectId'
      )
      return Promise.resolve({
        duration: 1000,
        mem: { total: 500, used: 400 },
        userAgent: 'Test Testerson',
        scr: {
          '0': 'data:image/png;base64,foobar',
          '1': 'data:image/png;base64,foobar'
        }
      })
    }

    it('receives the screenshot', async () => {
      const getScreenshot = getScreenshotFactory({
        loadPageAndEvaluateScript,
        logger,
        serviceOrigin: 'http://localhost:0000'
      })
      const screenshot = await getScreenshot({
        streamId: 'streamId',
        objectId: 'objectId'
      })
      if (!screenshot) {
        expect(screenshot).not.toBe(null)
        return //to avoid TS error
      }
      expect(screenshot['0']).toBe('data:image/png;base64,foobar')
      expect(screenshot['1']).toBe('data:image/png;base64,foobar')
    })
  })
})
