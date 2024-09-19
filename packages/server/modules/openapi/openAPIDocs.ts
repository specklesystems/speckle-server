import { getServerVersion } from '@/modules/shared/helpers/envHelper'
import type { OpenAPIV2 } from 'openapi-types'
import { OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

export const openAPIDoc: OpenAPIV2.Document = {
  swagger: '2.0',
  basePath: '/',
  info: {
    title: 'Speckle.',
    version: getServerVersion()
  },
  definitions: {},
  paths: {
    '/metrics': {
      get: {
        operationId: 'getMetrics',
        responses: {
          default: {
            description: 'Returns prometheus metrics'
          }
        }
      }
    }
  }
}

export const openApiDocument: () => OpenApiDocument & {
  getDocument: () => OpenAPIV2.Document
} = () => {
  const _openApiDoc = openAPIDoc

  return {
    registerOperation: (path, httpMethod, operation) => {
      _openApiDoc.paths[path] = _openApiDoc.paths[path] || {}
      _openApiDoc.paths[path][httpMethod] = operation
    },
    getDocument: () => _openApiDoc
  }
}
