'use strict'

const crypto = require( 'crypto' )
const knex = require( '../knex' )

const { parseAndCreateCommit } = require( './index' )
const { readFile } = require( './filesApi' )

async function startTask() {
  let { rows } = await knex.raw( `
    UPDATE file_uploads
    SET 
      "convertedStatus" = 1,
      "convertedLastUpdate" = NOW()
    FROM (
      SELECT "id" FROM file_uploads
      WHERE "convertedStatus" = 0 AND "uploadComplete" = 't'
      ORDER BY "convertedLastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE file_uploads."id" = task."id"
    RETURNING file_uploads."id"
  ` )
  return rows[0]
}

async function doTask( task ) {
  try {
    console.log( 'Doing task ', task )
    let { rows } = await knex.raw( `
      SELECT 
        id as "fileId", "streamId", "branchName", "userId", "fileName", "fileType"
      FROM file_uploads
      WHERE id = ?
      LIMIT 1
    `, [ task.id ] )
    let info = rows[0]
    if ( !info ) {
      throw new Error( 'Internal error: DB inconsistent' )
    }

    let data = await readFile( { fileId: info.fileId } )

    let ifcInput = {
        data,
        streamId: info.streamId,
        userId: info.userId,
        message: `File upload: ${info.fileName}`
    }
    if ( info.branchName ) ifcInput.branchName = info.branchName

    let commitId = await parseAndCreateCommit( ifcInput )

    await knex.raw( `
      UPDATE file_uploads
      SET
        "convertedStatus" = 2,
        "convertedLastUpdate" = NOW(),
        "convertedMessage" = 'File converted successfully',
        "convertedCommitId" = ?
      WHERE "id" = ?
    `, [ commitId, task.id ] )
  } catch ( err ) {
    console.log( 'Error: ', err )
    await knex.raw( `
      UPDATE file_uploads
      SET
        "convertedStatus" = 3,
        "convertedLastUpdate" = NOW(),
        "convertedMessage" = ?
      WHERE "id" = ?
    `, [ err.toString(), task.id ] )
  }

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


async function main() {
  console.log( 'Starting FileUploads Service...' )
  tick()
}

main()
