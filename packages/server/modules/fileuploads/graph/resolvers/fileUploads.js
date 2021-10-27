
const { getStreamFileUploads, getFileInfo } = require( '../../services/fileuploads' )

module.exports = {
  Stream: {
    async fileUploads( parent, args, context, info ) {
    	return await getStreamFileUploads( { streamId:parent.id } )
    },
    async fileUpload( parent, args, context, info ) {
      return await getFileInfo( { fileId: args.id } )
    }
  }
}