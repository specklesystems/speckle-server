const puppeteer = require('puppeteer')

class PuppeteerClient {
  constructor() {
    this.browser = null
  }

  async init(launchParams) {
    this.browser = await puppeteer.launch(launchParams)
  }

  async loadPageAndEvaluateScript(logger, url, script, ...args) {
    const page = await this.browser.newPage()

    await page.goto(url)

    logger.info('Page loaded')

    // Handle page crash (oom?)
    page.on('error', (err) => {
      logger.error(err, 'Page crashed')
      throw err
    })
    return await page.evaluate(script, args)
  }

  close() {
    this.browser.close()
  }
}

module.exports = {
  PuppeteerClient
}
