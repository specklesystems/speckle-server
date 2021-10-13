/* istanbul ignore file */
'use strict'

const S3 = require( 'aws-sdk/clients/s3' )

function getS3Config()
{
  // TODO: use ENV
  return {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
}


module.exports = {

  async getFileStream( { fileId } ) {
    const s3 = new S3( getS3Config() )
    let Bucket = process.env.S3_BUCKET
    let Key = `files/${fileId}`
    
    let fileStream = s3.getObject( { Key, Bucket } ).createReadStream()
    return fileStream
  },
  
  async readFile( { fileId } ) {
    const s3 = new S3( getS3Config() )
    let Bucket = process.env.S3_BUCKET
    let Key = `files/${fileId}`
    
    let s3Data = await s3.getObject( { Key, Bucket } ).promise()
    
    return s3Data.Body
  }

}
