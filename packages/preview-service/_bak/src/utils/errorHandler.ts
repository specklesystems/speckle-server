import { ErrorRequestHandler } from 'express'
import { isNaN, isObject, isString } from 'lodash-es'

export const errorHandler: ErrorRequestHandler = (err, req, res) => {
  if (
    isObject(err) &&
    'status' in err &&
    typeof err.status === 'number' &&
    !isNaN(err.status)
  ) {
    res.status(err?.status)
  } else {
    res.status(500)
  }

  res.setHeader('Content-Type', 'application/json')

  if (req.app.get('env') === 'development') {
    res.send(JSON.stringify(err, undefined, 2))
  } else if (isObject(err) && 'message' in err && isString(err.message)) {
    res.send(JSON.stringify({ message: err.message }))
  } else {
    res.send(JSON.stringify({ message: 'Internal Server Error' }))
  }
}
