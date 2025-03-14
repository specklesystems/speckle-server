/* istanbul ignore file */
'use strict'
const { ensureError } = require('@speckle/shared')
const fs = require('fs')
const path = require('node:path')
const { pipeline } = require('node:stream/promises')

module.exports = {
  async downloadFile({
    speckleServerUrl,
    fileId,
    streamId,
    token,
    destination,
    logger
  }) {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    logger.info(
      { destinationFile: destination },
      'Downloading file {fileId} from {streamId} to {destinationFile}'
    )
    const response = await fetch(
      `${speckleServerUrl}/api/stream/${streamId}/blob/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const writer = fs.createWriteStream(destination)

    //handle errors
    writer.on('error', (err) => {
      logger.error(ensureError(err), `Error writing file ${destination}`)
      throw err
    })

    //handle completion
    writer.on('finish', () => {
      logger.info(`File written to ${destination}`)
    })

    await pipeline(response.body, writer, { end: true })
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
