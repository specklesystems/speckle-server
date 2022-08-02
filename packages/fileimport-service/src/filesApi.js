/* istanbul ignore file */
'use strict'
const fs = require('fs')
const path = require('node:path')
const { stream, fetch } = require('undici')

module.exports = {
  async downloadFile({ fileId, streamId, token, destination }) {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    await stream(
      `${process.env.SPECKLE_SERVER_URL}/api/stream/${streamId}/blob/${fileId}`,
      {
        opaque: fs.createWriteStream(destination),
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      ({ opaque }) => opaque
    )
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
