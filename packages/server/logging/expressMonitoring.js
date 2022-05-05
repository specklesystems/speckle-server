/* istanbul ignore file */
/* eslint-disable no-unused-vars */
'use strict'

const prometheusClient = require('prom-client')
const responseTime = require('response-time')

let metricRequestDuration = null

module.exports = {
  createRequestDurationMiddleware() {
    if (metricRequestDuration === null) {
      metricRequestDuration = new prometheusClient.Summary({
        name: 'speckle_server_request_duration',
        help: 'Summary of express request duration',
        labelNames: ['route']
      })
    }

    return responseTime(function (req, res, time) {
      let route = 'unknown'
      if (req.originalUrl === '/graphql') route = '/graphql'
      if (req.route && req.route.path) route = req.route.path
      metricRequestDuration.labels(route).observe(time / 1000)
    })
  }
}
