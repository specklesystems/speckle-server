import { packageRoot } from '@/bootstrap'
import * as express from 'express'
import * as path from 'path'

module.exports = (app: express.Application) => {
  app.use('/static', express.static(path.join(packageRoot, 'assets', 'public')))
}
