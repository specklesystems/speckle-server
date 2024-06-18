const { get, isString, isNumber, isBoolean } = require('lodash')

// https://github.com/pinojs/pino-pretty?tab=readme-ov-file#handling-non-serializable-options
module.exports = (opts) =>
  require('pino-pretty')({
    ...opts,
    /**
     * Custom formatter to enable value interpolation locally
     * @param {Record<string, unknown>} log
     * @param {string} messageKey
     */
    messageFormat: (log, messageKey) => {
      const msg = log[messageKey]
      if (!msg) return undefined

      return msg.replace(/{([^{}]+)}/g, (match, p1) => {
        const val = get(log, p1)
        if (val === undefined) return match

        const formattedValue =
          isString(val) || isNumber(val) || isBoolean(val) ? val : JSON.stringify(val)
        return formattedValue
      })
    }
  })
