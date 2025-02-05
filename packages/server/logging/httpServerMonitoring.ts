/* istanbul ignore file */
import type { Nullable } from '@speckle/shared'
import prometheusClient from 'prom-client'
import type http from 'http'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metricActiveConnections: Nullable<prometheusClient.Gauge<any>> = null

export const monitorActiveConnections = (httpServer: http.Server) => {
  if (metricActiveConnections !== null) {
    prometheusClient.register.removeSingleMetric('speckle_server_active_connections')
  }

  metricActiveConnections = new prometheusClient.Gauge({
    name: 'speckle_server_active_connections',
    help: 'Number of active http connections',
    async collect() {
      let connectionCount = await new Promise<number>((resolve) => {
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
