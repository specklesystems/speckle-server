import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/logging/logging'
import { OpenAPIV3 } from 'openapi-types'
import { RequestHandler } from 'express'

export const openApiJsonPath = '/openapi/json'
const openApiHtmlPath = '/openapi/html'

const openApiHtml: RequestHandler = (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui.css" />
  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${openApiJsonPath}',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
      });
    };
  </script>
  </body>
</html>
`)
}

export const openApiJsonHandlerFactory: (params: {
  openApiDocument: OpenAPIV3.Document
}) => RequestHandler =
  ({ openApiDocument }) =>
  (_req, res) => {
    res.json(openApiDocument)
  }

export const init: SpeckleModule['init'] = async ({ app, openApiDocument }) => {
  moduleLogger.info('📖 Init OpenAPI documentation module')
  app.get(openApiHtmlPath, openApiHtml)
  openApiDocument.registerOperation(openApiHtmlPath, OpenAPIV3.HttpMethods.GET, {
    summary: 'OpenAPI HTML',
    description: 'Returns the OpenAPI documentation in HTML format',
    responses: {
      200: {
        description: 'Returns the OpenAPI documentation in HTML format'
      }
    }
  })
  openApiDocument.registerOperation(openApiJsonPath, OpenAPIV3.HttpMethods.GET, {
    summary: 'OpenAPI JSON',
    description: 'Returns the OpenAPI documentation in JSON format',
    responses: {
      200: {
        description: 'Returns the OpenAPI documentation in JSON format'
      }
    }
  })
  // to prevent cyclic dependency, we need to add the openApiJson handler to the app in top level after the modules are initialized
}
