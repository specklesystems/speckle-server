'use strict'

import createError from 'http-errors'
import express, { ErrorRequestHandler } from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'

import indexRouter from './routes/index'
import previewRouter from './routes/preview'
import objectsRouter from './routes/objects'
import apiRouter from './routes/api'
import { LoggingExpressMiddleware } from '../observability/expressLogging'

export const app = express()

app.use(LoggingExpressMiddleware)

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: false }))
app.use(cookieParser())
//webpack will build the renderPage and save it to the packages/preview-service/dist/public directory
app.use(express.static(path.join(__dirname, '../public')))

app.use('/', indexRouter)
app.use('/preview', previewRouter)
app.use('/objects', objectsRouter)
app.use('/api', apiRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, `Not Found: ${req.url}`))
})

const errorHandler: ErrorRequestHandler = (err, req, res) => {
  let errorText = err.message
  if (req.app.get('env') === 'development') {
    errorText = `<html><body><pre>${err.message}: ${err.status}\n${err.stack}</pre></body></html>`
  }
  res.status(err.status || 500)
  res.send(errorText)
}

app.use(errorHandler)
