import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/logging/logging'
import { readFile } from 'fs/promises'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { HttpMethod } from '@/modules/shared/helpers/typeHelper'

async function getExplorerHtml() {
  const fileBaseContents = await readFile(
    require.resolve('#/assets/apiexplorer/templates/explorer.html'),
    { encoding: 'utf-8' }
  )
  return fileBaseContents.replace(
    'const FRONTEND_ORIGIN = window.location.origin',
    `const FRONTEND_ORIGIN = '${getFrontendOrigin()}'`
  )
}

export const init: SpeckleModule['init'] = ({ app, openApiDocument }) => {
  moduleLogger.info('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', async (_req, res) => {
    res.send(await getExplorerHtml())
  })
  openApiDocument.registerOperation('/explorer', HttpMethod.GET, {
    summary: 'GraphQL API Explorer',
    description: 'GraphQL API Explorer',
    responses: {
      default: {
        description: 'Returns the GraphQL API Explorer'
      }
    }
  })
}
