import { extendLoggerComponent } from '@/observability/logging.js'
import { isDevelopment } from '@/utils/env.js'
import type { Logger } from 'pino'
import puppeteer, { type EvaluateFunc, type PuppeteerLaunchOptions } from 'puppeteer'

export type LoadPageAndEvaluateScript = (...args: unknown[]) => Promise<unknown>

export type PuppeteerClient = {
  loadPageAndEvaluateScript: LoadPageAndEvaluateScript
  dispose: () => Promise<void>
}

export const puppeteerClientFactory = async (deps: {
  logger: Logger
  url: string
  script: EvaluateFunc<[unknown[]]>
  launchParams?: PuppeteerLaunchOptions
}): Promise<PuppeteerClient> => {
  const logger = extendLoggerComponent(
    deps.logger.child({ renderPageUrl: deps.url }),
    'puppeteer'
  )
  const { url, script, launchParams } = deps
  const browser = await puppeteer.launch({ ...launchParams, dumpio: isDevelopment() })
  return {
    loadPageAndEvaluateScript: async (...args: unknown[]) => {
      if (!browser) {
        const errorMessage = 'Browser must be initialized using init() before use.'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
      logger.info('Loading page from {renderPageUrl}')
      const page = await browser.newPage()

      await page.goto(url)

      logger.info('Page loaded from {renderPageUrl}')

      // Handle page crash (oom?)
      page
        .on('error', (err) => {
          logger.error(err, 'Page crashed')
          throw err
        })
        .on('console', (message) => {
          let messageText = message.text()
          if (messageText.startsWith('data:image'))
            messageText = messageText.substring(0, 200).concat('...')
          logger.info(
            //FIXME: should be debug, but setting to info while developing.
            `${message.type().substring(0, 3).toUpperCase()} ${messageText}`
          )
        })
        .on('pageerror', ({ message }) => {
          logger.error(message)
        })
        .on('response', (response) =>
          logger.info(`${response.status()} ${response.url()}`)
        )
        .on('requestfailed', (request) =>
          logger.error(`${request.failure()?.errorText} ${request.url()}`)
        )

      //TODO add timeout for page load
      //TODO parse the response and ensure it's type of T
      const evaluationResult: unknown = await page.evaluate(script, args)

      logger.info('Page evaluated with Puppeteer script.')
      return evaluationResult
    },
    dispose: async () => {
      if (!browser) return
      await browser.close()
    }
  }
}
