'use strict'

const express = require('express')
const prometheusClient = require('prom-client')

const router = express.Router()

router.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', prometheusClient.register.contentType)
  res.end(await prometheusClient.register.metrics())
})

module.exports = router
