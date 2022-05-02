/* istanbul ignore file */
/* eslint-disable no-unused-vars */
'use strict'

const prometheusClient = require('prom-client')

let metricActiveConnections = null

module.exports = {
  monitorActiveConnections(httpServer) {
    if (metricActiveConnections !== null) {
      prometheusClient.register.removeSingleMetric('speckle_server_active_connections')
    }

    metricActiveConnections = new prometheusClient.Gauge({
      name: 'speckle_server_active_connections',
      help: 'Number of active http connections',
      async collect() {
        let connectionCount = await new Promise((resolve, reject) => {
          httpServer.getConnections(function (error, count) {
            if (error) resolve(-1)
            else resolve(count)
          })
        })
        if (isNaN(connectionCount)) connectionCount = -1
        this.set(connectionCount)
      }
    })
  }
}
