import { getServerVersion } from '@/modules/shared/helpers/envHelper'
import type { OpenAPIV3 } from 'openapi-types'
import { OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

const defaultOpenAPIDoc: OpenAPIV3.Document = {
  openapi: '2.0',
  info: {
    title: 'Speckle.',
    version: getServerVersion()
  },
  paths: {}
}

export const openApiDocument: () => OpenApiDocument & {
  getDocument: () => OpenAPIV3.Document
} = () => {
  const _openApiDoc = defaultOpenAPIDoc

  return {
    registerOperation: (path, httpMethod, operation) => {
      _openApiDoc.paths[path] = _openApiDoc.paths[path] || {}
      _openApiDoc.paths[path]![httpMethod] = operation
    },
    getDocument: () => _openApiDoc
  }
}
