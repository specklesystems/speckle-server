'use strict'

const crypto = require( 'crypto' )
const knex = require( '../knex' )
const fetch = require( 'node-fetch' )
const ObjectPreview = ( ) => knex( 'object_preview' )
const Previews = ( ) => knex( 'previews' )

async function startTask() {
  let { rows } = await knex.raw( `
    UPDATE object_preview
    SET 
      "previewStatus" = 1,
      "lastUpdate" = NOW()
    FROM (
      SELECT "streamId", "objectId" FROM object_preview
      WHERE "previewStatus" = 0 OR ("previewStatus" = 1 AND "lastUpdate" < NOW() - INTERVAL '1 HOUR')
      ORDER BY "priority" ASC, "lastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE object_preview."streamId" = task."streamId" AND object_preview."objectId" = task."objectId"
    RETURNING object_preview."streamId", object_preview."objectId"
  ` )
  return rows[0]
}

async function doTask( task ) {
  
  let previewUrl = `http://127.0.0.1:3001/preview/${task.streamId}/${task.objectId}`
  let res = await fetch( previewUrl )
  res = await res.json()
  // let imgBuffer = await res.buffer()  // this gets the binary response body

  let metadata = {}

  for ( let angle in res ) {
    const imgBuffer = new Buffer.from( res[angle].replace( /^data:image\/\w+;base64,/, '' ), 'base64' )
    let previewId = crypto.createHash( 'md5' ).update( imgBuffer ).digest( 'hex' )

    // Save preview image
    let insertionObject = { id: previewId, data: imgBuffer }
    //await Previews().insert( insertionObject )
    //let dbQuery = Previews().insert( insertionObject ).toString( ) + ' on conflict do nothing'
    await knex.raw( 'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING', [ previewId, imgBuffer ] )

    metadata[angle] = previewId
  }

  // Update preview metadata
  await knex.raw( `
    UPDATE object_preview
    SET
      "previewStatus" = 2,
      "lastUpdate" = NOW(),
      "preview" = ?
    WHERE "streamId" = ? AND "objectId" = ?
  `, [ metadata, task.streamId, task.objectId ] )


}

async function tick() {
  try {
    let task = await startTask()
    if ( !task ) {
      setTimeout( tick, 1000 )
      return
    }

    await doTask( task )

    // Check for another task very soon
    setTimeout( tick, 10 )
  } catch ( err ) {
    console.log( 'Error executing task: ', err )
    setTimeout( tick, 5000 )
  }
}

async function startPreviewService() {
  console.log( '📸 Started Preview Service' )

  tick()
}

module.exports = { startPreviewService }
