/* istanbul ignore file */
'use strict'

const appRoot = require( 'app-root-path' )
const crs = require( 'crypto-random-string' )
const knex = require( `${appRoot}/db/knex` )
const S3 = require( 'aws-sdk/clients/s3' )
const stream = require( 'stream' )

const FileUploads = ( ) => knex( 'file_uploads' )

function getS3Config()
{
  // TODO: use ENV
  return {
    accessKeyId: 'minioadmin' ,
    secretAccessKey: 'minioadmin' ,
    endpoint: 'http://127.0.0.1:9000' ,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
}


module.exports = {

  async uploadFile( { streamId, userId, fileName, fileType, fileStream } ) {
    // Create ID and db entry
    let fileId = crs( { length: 10 } )
    let dbFile = {
      id: fileId,
      streamId,
      userId,
      fileName,
      fileType,
    }
    await FileUploads( ).insert( dbFile )
    
    // Upload stream
    const s3 = new S3( getS3Config() )
    let Bucket = 'server'
    let Key = `files/${fileId}`
    
    let uploadResponse = await s3.upload( { Bucket, Key, Body: fileStream } ).promise()

    // Get file size and update db entry
    let headResponse = await s3.headObject( { Key, Bucket } ).promise()
    let fileSize = headResponse.ContentLength

    await FileUploads().where( { id: fileId } ).update( { uploadComplete: true, fileSize } )
  }
}
