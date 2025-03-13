/* istanbul ignore file */
'use strict'
const { ensureError } = require('@speckle/shared')
const fs = require('fs')
const path = require('node:path')
const { finished } = require('node:stream/promises')

module.exports = {
  async downloadFile({ fileId, streamId, token, destination, logger }) {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    logger.info(`Downloading file ${fileId} to ${destination}`)
    const response = await fetch(
      `${process.env.SPECKLE_SERVER_URL}/api/stream/${streamId}/blob/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const writer = fs.createWriteStream(destination)
    await finished(response.body.pipe(writer), (err) => {
      if (err) {
        logger.error(
          ensureError(err, 'Unknown error while downloading file'),
          `Error downloading file ${fileId}`
        )
      }
    })
  },
  async getFileInfoByName({ fileName, streamId, token }) {
    const response = await fetch(
      `${process.env.SPECKLE_SERVER_URL}/api/stream/${streamId}/blobs?fileName=${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.json()
  }
}
