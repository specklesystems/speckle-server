import * as express from 'express'
import { getServerInfo } from '@/modules/core/services/generic'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'

module.exports = (app: express.Application) => {
  app.options('/liveness')
  app.post('/liveness', handleLiveness)
  app.options('/readiness')
  app.post('/readiness', handleLiveness) //TODO create a dedicated handler for readiness
}

const handleLiveness: express.RequestHandler = async (req, res) => {
  try {
    await getServerInfo()
  } catch (err) {
    req.log.error(err, 'Health check failed. Postgres is not available.')
    res.status(500).json({
      message: 'Postgres is not available',
      error: err
    })
    res.send()
    return
  }

  const client = createRedisClient(getRedisUrl(), {})
  client.ping((err) => {
    if (err) {
      req.log.error(err, 'Health check failed. Redis is not available.')
      res.status(500).json({
        message: 'Redis is not available',
        error: err
      })
      res.send()
      return
    }
  })

  req.log.trace('Health check passed.')
  res.status(200).json({ message: 'OK' })
  res.send()
}
