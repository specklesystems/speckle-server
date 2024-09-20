import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { OpenAPIV2 } from 'openapi-types'
import prometheusClient from 'prom-client'
import { moduleLogger } from '@/logging/logging'
import { RequestHandler } from 'express'

const metricsPath = '/metrics'

export const metricsRouteHandler: RequestHandler = async (req, res) => {
  try {
    res.set('Content-Type', prometheusClient.register.contentType)
    res.end(await prometheusClient.register.metrics())
  } catch (ex: unknown) {
    res.status(500).end(ex instanceof Error ? ex.message : `${ex}`)
  }
}

export const init: SpeckleModule['init'] = async ({ app, openApiDocument }) => {
  moduleLogger.info('📈 Init metrics module')
  app.get(metricsPath, metricsRouteHandler)
  openApiDocument.registerOperation(metricsPath, OpenAPIV2.HttpMethods.GET, {
    summary: 'Metrics',
    description: 'Returns Prometheus metrics',
    responses: {
      200: {
        description: 'Returns Prometheus metrics'
      }
    }
  })
}
