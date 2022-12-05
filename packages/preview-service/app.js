'use strict'

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const indexRouter = require('./routes/index')
const previewRouter = require('./routes/preview')
const objectsRouter = require('./routes/objects')
const apiRouter = require('./routes/api')

const app = express()

app.use(logger('dev'))

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/preview', previewRouter)
app.use('/objects', objectsRouter)
app.use('/api', apiRouter)

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
