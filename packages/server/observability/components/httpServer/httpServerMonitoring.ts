/* istanbul ignore file */
import type { Nullable } from '@speckle/shared'
import { Registry, Gauge } from 'prom-client'
import type { Server } from 'http'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metricActiveConnections: Nullable<Gauge<any>> = null

export const monitorActiveConnections = (params: {
  httpServer: Server
  registers: Registry[]
}) => {
  const { httpServer, registers } = params
  if (metricActiveConnections !== null) {
    registers.forEach((r) => r.removeSingleMetric('speckle_server_active_connections'))
  }

  metricActiveConnections = new Gauge({
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
