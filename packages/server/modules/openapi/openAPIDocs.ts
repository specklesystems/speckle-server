import { getServerVersion } from '@/modules/shared/helpers/envHelper'
import type { OpenAPIV2 } from 'openapi-types'
import { OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

const defaultOpenAPIDoc: OpenAPIV2.Document = {
  swagger: '2.0',
  basePath: '/',
  info: {
    title: 'Speckle.',
    version: getServerVersion()
  },
  definitions: {},
  paths: {}
}

export const openApiDocument: () => OpenApiDocument & {
  getDocument: () => OpenAPIV2.Document
} = () => {
  const _openApiDoc = defaultOpenAPIDoc

  return {
    registerOperation: (path, httpMethod, operation) => {
      _openApiDoc.paths[path] = _openApiDoc.paths[path] || {}
      _openApiDoc.paths[path][httpMethod] = operation
    },
    getDocument: () => _openApiDoc
  }
}
