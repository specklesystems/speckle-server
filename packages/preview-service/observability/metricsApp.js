'use strict'
const express = require('express')
const createError = require('http-errors')
const { LoggingExpressMiddleware } = require('./expressLogging')

const metricsRouter = require('./metricsRoute')

const app = express()

app.use(LoggingExpressMiddleware)
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: false }))

app.use('/metrics', metricsRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, `Not Found: ${req.url}`))
})

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(err.status || 500)
  res.send(err.message)
})

module.exports = app
