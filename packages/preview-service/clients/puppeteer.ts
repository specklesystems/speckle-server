import puppeteer, { Browser, EvaluateFunc, PuppeteerLaunchOptions } from 'puppeteer'
import { isDevelopment } from '../utils/env'
import { extendLoggerComponent } from '../observability/logging'
import { Logger } from 'pino'

export interface PuppeteerClientInterface {
  init(launchParams?: PuppeteerLaunchOptions): Promise<void>
  loadPageAndEvaluateScript(...args: unknown[]): Promise<unknown>
  close(): void
}

export class PuppeteerClient implements PuppeteerClientInterface {
  browser: Browser | null
  logger: Logger
  url: string
  script: EvaluateFunc<[unknown[]]>
  constructor(params: {
    logger: Logger
    url: string
    script: EvaluateFunc<[unknown[]]>
  }) {
    this.logger = extendLoggerComponent(
      params.logger.child({ renderPageUrl: params.url }),
      'puppeteer'
    )
    this.url = params.url
    this.script = params.script
    this.browser = null
  }

  async init(launchParams?: PuppeteerLaunchOptions) {
    this.browser = await puppeteer.launch({ ...launchParams, dumpio: isDevelopment() })
  }

  async loadPageAndEvaluateScript(...args: unknown[]): Promise<unknown> {
    if (!this.browser) {
      const errorMessage = 'Browser must be initialized using init() before use.'
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }
    this.logger.info('Loading page from {renderPageUrl}')
    const page = await this.browser.newPage()

    await page.goto(this.url)

    this.logger.info('Page loaded from {renderPageUrl}')

    // Handle page crash (oom?)
    page
      .on('error', (err) => {
        this.logger.error(err, 'Page crashed')
        throw err
      })
      .on('console', (message) => {
        let messageText = message.text()
        if (messageText.startsWith('data:image'))
          messageText = messageText.substring(0, 200).concat('...')
        this.logger.info(
          //FIXME: should be debug, but setting to info while developing.
          `${message.type().substring(0, 3).toUpperCase()} ${messageText}`
        )
      })
      .on('pageerror', ({ message }) => {
        this.logger.error(message)
      })
      .on('response', (response) =>
        this.logger.info(`${response.status()} ${response.url()}`)
      )
      .on('requestfailed', (request) =>
        this.logger.error(`${request.failure()?.errorText} ${request.url()}`)
      )

    //TODO add timeout for page load
    //TODO parse the response and ensure it's type of T
    const evaluationResult: unknown = await page.evaluate(this.script, args)

    this.logger.info('Page evaluated with Puppeteer script.')
    return evaluationResult
  }

  close() {
    if (!this.browser) return
    this.browser.close()
  }
}
