import '@/bootstrap.js' // This has side-effects and has to be imported first

import { startServer } from '@/server/server.js'
import { startPreviewService } from '@/server/background.js'
import { db } from '@/clients/knex.js'
import { puppeteerClientFactory } from '@/clients/puppeteer.js'
import { extendLoggerComponent, logger } from '@/observability/logging.js'
import { puppeteerDriver } from '@/scripts/puppeteerDriver.js'
import {
  getChromiumExecutablePath,
  getPreviewTimeout,
  getPuppeteerUserDataDir,
  serviceOrigin,
  shouldBeHeadless
} from '@/utils/env.js'

const puppeteerClient = await puppeteerClientFactory({
  logger: extendLoggerComponent(logger, 'puppeteerClient'),
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

startServer({ db, puppeteerClient })
startPreviewService({ db })
