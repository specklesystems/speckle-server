const getAppPort = () => process.env.PORT || '3001'
const getChromiumExecutablePath = () =>
  process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
const getHost = () => process.env.HOST || '127.0.0.1'
const getPuppeteerUserDataDir = () => process.env.USER_DATA_DIR || '/tmp/puppeteer'
const shouldBeHeadless = () => process.env.PREVIEWS_HEADED !== 'true'

module.exports = {
  getAppPort,
  getChromiumExecutablePath,
  getHost,
  getPuppeteerUserDataDir,
  shouldBeHeadless
}
