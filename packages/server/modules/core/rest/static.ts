import { packageRoot } from '@/bootstrap'
import { HttpMethod, type OpenApiDocument } from '@/modules/shared/helpers/typeHelper'
import * as express from 'express'
import * as path from 'path'

export default (params: {
  app: express.Application
  openApiDocument: OpenApiDocument
}) => {
  const { app, openApiDocument } = params
  app.use('/static', express.static(path.join(packageRoot, 'assets', 'public')))
  openApiDocument.registerOperation('/static', HttpMethod.GET, {
    description: 'Static assets',
    responses: {
      200: {
        description: 'An asset was retrieved.'
      }
    }
  })
}
