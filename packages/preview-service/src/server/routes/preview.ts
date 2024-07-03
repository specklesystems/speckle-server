import { PuppeteerClient } from '@/clients/puppeteer.js'
import { puppeteerDriver } from '@/scripts/puppeteerDriver.js'
import { getScreenshotFactory } from '@/services/screenshot.js'
import { serviceOrigin } from '@/utils/env.js'
import express, { RequestHandler } from 'express'

const previewRouterFactory = () => {
  const previewRouter = express.Router()

  previewRouter.get(
    '/:streamId/:objectId',
    async function (req, res) {
      const { streamId, objectId } = req.params || {}
      const safeParamRgx = /^[\w]+$/i
      if (!safeParamRgx.test(streamId) || !safeParamRgx.test(objectId)) {
        return res.status(400).json({ error: 'Invalid streamId or objectId!' })
      }
      const boundLogger = req.log.child({ streamId, objectId })

      boundLogger.info('Requesting screenshot.')

      const puppeteerClient = new PuppeteerClient({
        logger: boundLogger,
        url: `${serviceOrigin()}/render/`,
        script: puppeteerDriver
      })

      const screenshot = await getScreenshotFactory({
        puppeteerClient,
        logger: boundLogger,
        serviceOrigin: serviceOrigin()
      })({
        objectId,
        streamId
      })

      if (!screenshot) {
        return res.status(500).end()
      }

      // res.setHeader( 'content-type', 'image/png' )
      res.send(screenshot)
    } as RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )

  return previewRouter
}

export default previewRouterFactory
