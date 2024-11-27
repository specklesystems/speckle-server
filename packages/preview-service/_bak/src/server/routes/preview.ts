import { puppeteerClientFactory } from '@/clients/puppeteer.js'
import { puppeteerDriver } from '@/scripts/puppeteerDriver.js'
import { getScreenshotFactory } from '@/services/screenshot.js'
import {
  getChromiumExecutablePath,
  getPreviewTimeout,
  getPuppeteerUserDataDir,
  serviceOrigin,
  shouldBeHeadless
} from '@/utils/env.js'
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

      //FIXME should we be creating a puppeteer client for every request, or per app instance?
      const puppeteerClient = await puppeteerClientFactory({
        logger: boundLogger,
        url: `${serviceOrigin()}/render/`,
        script: puppeteerDriver,
        launchParams: {
          headless: shouldBeHeadless(),
          userDataDir: getPuppeteerUserDataDir(),
          executablePath: getChromiumExecutablePath(),
          protocolTimeout: getPreviewTimeout(),
          // we trust the web content that is running, so can disable the sandbox
          // disabling the sandbox allows us to run the docker image without linux kernel privileges
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        },
        timeoutMilliseconds: getPreviewTimeout()
      })

      let screenshot: { [key: string]: string } | null = null
      try {
        screenshot = await getScreenshotFactory({
          loadPageAndEvaluateScript: puppeteerClient.loadPageAndEvaluateScript,
          logger: boundLogger,
          serviceOrigin: serviceOrigin()
        })({
          objectId,
          streamId
        })
      } finally {
        await puppeteerClient.dispose()
      }

      if (!screenshot) {
        return res.status(500).end()
      }

      res.setHeader('content-type', 'image/png')
      res.send(screenshot)
    } as RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )

  return previewRouter
}

export default previewRouterFactory
