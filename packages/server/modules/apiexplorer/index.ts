import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { readFile } from 'fs/promises'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { fileURLToPath } from 'url'

async function getExplorerHtml() {
  const fileBaseContents = await readFile(
    fileURLToPath(import.meta.resolve('#/assets/apiexplorer/templates/explorer.html')),
    { encoding: 'utf-8' }
  )
  return fileBaseContents.replace(
    'const FRONTEND_ORIGIN = window.location.origin',
    `const FRONTEND_ORIGIN = '${getFrontendOrigin()}'`
  )
}

export const init: SpeckleModule['init'] = ({ app }) => {
  moduleLogger.info('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', async (_req, res) => {
    res.send(await getExplorerHtml())
  })
}
