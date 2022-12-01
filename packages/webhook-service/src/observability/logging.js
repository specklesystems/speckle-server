const { logger: baseLogger, extendLoggerComponent } = require('@speckle/shared')

const logger = extendLoggerComponent(baseLogger, 'webhook-service')

module.exports = {
  logger
}
