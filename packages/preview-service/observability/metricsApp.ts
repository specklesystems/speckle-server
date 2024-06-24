import express, { ErrorRequestHandler } from 'express'
import createError from 'http-errors'
import { LoggingExpressMiddleware } from './expressLogging'
import metricsRouter from './metricsRoute'

const app = express()
export default app

app.use(LoggingExpressMiddleware)
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: false }))

app.use('/metrics', metricsRouter)

// catch 404 and forward to error handler
app.use(function (req, _res, next) {
  next(createError(404, `Not Found: ${req.url}`))
})

const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  res.status(err.status || 500)
  res.send(err.message)
}
app.use(errorHandler)
