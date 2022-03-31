const { getStreamFileUploads, getFileInfo } = require('../../services/fileuploads')

module.exports = {
  Stream: {
    async fileUploads(parent) {
      return await getStreamFileUploads({ streamId: parent.id })
    },
    async fileUpload(parent, args) {
      return await getFileInfo({ fileId: args.id })
    }
  }
}
