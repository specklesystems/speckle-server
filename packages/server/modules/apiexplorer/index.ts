import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/logging/logging'
import { readFile } from 'fs/promises'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { handleErrors } from '@/modules/shared/helpers/expressHelper'

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

export const init: SpeckleModule['init'] = (app) => {
  moduleLogger.info('💅 Init graphql api explorer module')

  app.get(
    '/explorer',
    handleErrors({
      handler: async (_req, res) => {
        res.send(await getExplorerHtml())
      },
      verbPhraseForErrorMessage: 'serving the GraphQL explorer'
    })
  )
}
