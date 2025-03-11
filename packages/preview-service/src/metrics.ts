import prometheusClient, { Registry } from 'prom-client'
import type { Express } from 'express'

let prometheusRegistryInitialized = false
let prometheusInitialized = false

export const initPrometheusRegistry = () => {
  if (!prometheusRegistryInitialized) {
    prometheusRegistryInitialized = true
    prometheusClient.register.clear()
    prometheusClient.register.setDefaultLabels({
      project: 'speckle-server',
      app: 'preview-service'
    })
  }

  return prometheusClient.register
}

export const initMetrics = async (params: { app: Express; registry: Registry }) => {
  const { app, registry } = params
  if (!prometheusInitialized) {
    prometheusInitialized = true
    prometheusClient.collectDefaultMetrics({
      register: registry
    })
  }
  app.get('/metrics', async (req, res, next) => {
    try {
      res.set('Content-Type', registry.contentType)
      res.end(await registry.metrics())
    } catch (ex: unknown) {
      res.status(500).end(ex instanceof Error ? ex.message : `${ex}`)
      next(ex)
    }
  })
}
