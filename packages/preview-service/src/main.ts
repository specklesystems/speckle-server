import express from 'express'
import { isTestEnvironment } from '@/config.js'
import { initMetrics, initPrometheusRegistry } from '@/metrics.js'
import { buildServer, initServer } from '@/server.js'

const app = express()

// serve the preview-frontend
app.use(express.static('public'))

if (!isTestEnvironment()) await initMetrics({ app, registry: initPrometheusRegistry() })

const server = buildServer({ app })

initServer(server)
