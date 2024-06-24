import puppeteer, { Browser } from 'puppeteer'
import { isDevelopment } from '../utils/env'
import { extendLoggerComponent } from '../observability/logging'

export class PuppeteerClient {
  browser: Browser | null
  constructor() {
    this.browser = null
  }

  async init(launchParams) {
    if (isDevelopment())
      this.browser = await puppeteer.launch({ ...launchParams, dumpio: true })
    this.browser = await puppeteer.launch(launchParams)
  }

  async loadPageAndEvaluateScript<T>(logger, url, script, ...args): Promise<T> {
    const boundLogger = extendLoggerComponent(
      logger.child({ renderPageUrl: url }),
      'puppeteer'
    )
    if (!this.browser) {
      const errorMessage = 'Browser must be initialized using init() before use.'
      boundLogger.error(errorMessage)
      throw new Error(errorMessage)
    }
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
        boundLogger.error(`${request.failure()?.errorText} ${request.url()}`)
      )

    //TODO add timeout for page load
    //TODO parse the response and ensure it's type of T
    const evaluationResult: T = await page.evaluate(script, args)

    boundLogger.info('Page evaluated with Puppeteer script.')
    return evaluationResult
  }

  close() {
    if (!this.browser) return
    this.browser.close()
  }
}
