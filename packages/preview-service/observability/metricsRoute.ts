import express from 'express'
import prometheusClient from 'prom-client'

const router = express.Router()
export default router

router.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', prometheusClient.register.contentType)
  res.end(await prometheusClient.register.metrics())
})
