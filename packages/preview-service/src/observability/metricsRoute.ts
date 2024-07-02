import express from 'express'
import prometheusClient from 'prom-client'

export const metricsRouterFactory = () => {
  const metricsRouter = express.Router()

  metricsRouter.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', prometheusClient.register.contentType)
    res.end(await prometheusClient.register.metrics())
  })
  return metricsRouter
}
