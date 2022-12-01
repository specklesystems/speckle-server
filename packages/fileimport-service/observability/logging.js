const { logger: baseLogger, extendLoggerComponent } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = extendLoggerComponent(baseLogger, 'fileimport-service')

module.exports = {
  logger
}
