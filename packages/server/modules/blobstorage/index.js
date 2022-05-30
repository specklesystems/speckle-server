const { contextMiddleware } = require('@/modules/shared')

// const authorizeStreamAccess

exports.init = async (app) => {
  // eslint-disable-next-line no-unused-vars
  app.post('stream/:streamId/blob', contextMiddleware, async (req, res) => {
    // no checking of startup conditions, just dont init the endpoints if not configured right
    //authorize request
  })

  app.get('stream/:streamId/blob/:blobId')
  app.delete('stream/:streamId/blob/:blobId')
}

exports.finalize = () => {}
