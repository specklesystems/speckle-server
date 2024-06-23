const puppeteer = require('puppeteer')
const { isDevelopment } = require('../utils/env')
const { extendLoggerComponent } = require('../observability/logging')

class PuppeteerClient {
  constructor() {
    this.browser = null
  }

  async init(launchParams) {
    if (isDevelopment())
      this.browser = await puppeteer.launch({ ...launchParams, dumpio: true })
    this.browser = await puppeteer.launch(launchParams)
  }

  async loadPageAndEvaluateScript(logger, url, script, ...args) {
    const boundLogger = extendLoggerComponent(
      logger.child({ renderPageUrl: url }),
      'puppeteer'
    )
    boundLogger.info('Loading page from {renderPageUrl}')
    const page = await this.browser.newPage()

    await page.goto(url)

    boundLogger.info('Page loaded from {renderPageUrl}')

    // Handle page crash (oom?)
    page
      .on('error', (err) => {
        boundLogger.error(err, 'Page crashed')
        throw err
      })
      .on('console', (message) => {
        let messageText = message.text()
        if (messageText.startsWith('data:image'))
          messageText = messageText.substring(0, 200).concat('...')
        boundLogger.info(
          //FIXME: should be debug, but setting to info while developing.
          `${message.type().substring(0, 3).toUpperCase()} ${messageText}`
        )
      })
      .on('pageerror', ({ message }) => {
        boundLogger.error(message)
      })
      .on('response', (response) =>
        boundLogger.info(`${response.status()} ${response.url()}`)
      )
      .on('requestfailed', (request) =>
        boundLogger.error(`${request.failure().errorText} ${request.url()}`)
      )
    const evaluationResult = await page.evaluate(script, args)

    boundLogger.info('Page evaluated with Puppeteer script.')
    return evaluationResult
  }

  close() {
    this.browser.close()
  }
}

module.exports = {
  PuppeteerClient
}
