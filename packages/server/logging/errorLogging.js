/* istanbul ignore file */
const prometheusClient = require('prom-client')

let metricErrorCount = null

module.exports = {
  errorLoggingMiddleware(err, req, res, next) {
    if (metricErrorCount === null) {
      metricErrorCount = new prometheusClient.Counter({
        name: 'speckle_server_request_errors',
        help: 'Number of requests that threw exceptions',
        labelNames: ['route']
      })
    }

    console.log(`Error when handling ${req.originalUrl} from ${req.ip}: ${err.message}`)
    let route = 'unknown'
    if (req.route && req.route.path) route = req.route.path
    metricErrorCount.labels(route).inc()
    next(err)
  }
}
