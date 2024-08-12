/* istanbul ignore file */
const Sentry = require('@sentry/node')

/**
 * @param {{
 *  err: Error | unknown,
 *  kind?: string | null,
 *  extras?: { [key: string]: any } | null
 * }} param0
 */
module.exports = function ({ err, kind, extras }) {
  Sentry.withScope((scope) => {
    if (kind) scope.setTag('kind', kind)
    if (extras) scope.setExtra('extras', extras)

    Sentry.captureException(err)
  })
}
