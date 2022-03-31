'use strict'

let createError = require('http-errors')
let express = require('express')
let path = require('path')
let cookieParser = require('cookie-parser')
let logger = require('morgan')

let indexRouter = require('./routes/index')
let previewRouter = require('./routes/preview')
let objectsRouter = require('./routes/objects')
let apiRouter = require('./routes/api')
const prometheusClient = require('prom-client')

prometheusClient.register.clear()
prometheusClient.collectDefaultMetrics()

let app = express()

app.use(logger('dev'))

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/preview', previewRouter)
app.use('/objects', objectsRouter)
app.use('/api', apiRouter)

// Expose prometheus metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', prometheusClient.register.contentType)
    res.end(await prometheusClient.register.metrics())
  } catch (ex) {
    res.status(500).end(ex.message)
  }
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res) {
  let errorText = err.message
  if (req.app.get('env') === 'development') {
    errorText = `<html><body><pre>${err.message}: ${err.status}\n${err.stack}</pre></body></html>`
  }
  res.status(err.status || 500)
  res.send(errorText)
})

module.exports = app
