/* istanbul ignore file */
const { moduleLogger } = require('@/logging/logging')
const { readFile } = require('fs/promises')
const { getFrontendOrigin } = require('@/modules/shared/helpers/envHelper')

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

exports.init = (app) => {
  moduleLogger.info('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', async (_req, res) => {
    res.send(await getExplorerHtml())
  })
}

exports.finalize = () => {}
