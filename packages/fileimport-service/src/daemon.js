'use strict'

const crypto = require( 'crypto' )
const knex = require( '../knex' )

const { getFileStream } = require( './filesApi' )
const fs = require( 'fs' )
const { spawn } = require( 'child_process' )

const ServerAPI = require( '../ifc/api' )

const TMP_FILE_PATH = '/tmp/file_to_import'
const TMP_RESULTS_PATH = '/tmp/import_result.json'

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
  let tempUserToken = null
  let serverApi = null

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

    let upstreamFileStream = await getFileStream( { fileId: info.fileId } )
    let diskFileStream = fs.createWriteStream( TMP_FILE_PATH )
    
    upstreamFileStream.pipe( diskFileStream )

    await new Promise( fulfill => diskFileStream.on( 'finish' , fulfill ) )
    
    serverApi = new ServerAPI( { streamId: info.streamId } )
    let { token } = await serverApi.createToken( { userId: info.userId, name: 'temp upload token', scopes: [ 'streams:write', 'streams:read' ], lifespan: 1000000 } )
    tempUserToken = token

    await runProcessWithTimeout(
      'node',
      [
        './ifc/import_file.js',
        TMP_FILE_PATH,
        info.userId,
        info.streamId,
        info.branchName,
        `File upload: ${info.fileName}`
      ],
      {
        USER_TOKEN: tempUserToken
      },
      10 * 60 * 1000
    )

    let output = JSON.parse( fs.readFileSync( TMP_RESULTS_PATH ) )

    if ( !output.success )
      throw new Error( output.error )

    let commitId = output.commitId

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

  if ( fs.existsSync( TMP_FILE_PATH ) ) fs.unlinkSync( TMP_FILE_PATH )
  if ( fs.existsSync( TMP_RESULTS_PATH ) ) fs.unlinkSync( TMP_RESULTS_PATH )

  if ( tempUserToken ) {
    await serverApi.revokeTokenById( tempUserToken )
  }

}

function runProcessWithTimeout( cmd, cmdArgs, extraEnv, timeoutMs ) {
  
  return new Promise( ( resolve, reject ) => {
    console.log( `Starting process: ${cmd} ${cmdArgs}` )
    const childProc = spawn( cmd, cmdArgs, { env: { ...process.env, ...extraEnv } } )

    childProc.stdout.on( 'data', ( data ) => {
      console.log( 'Parser: ', data.toString() )
    } )

    childProc.stderr.on( 'data', ( data ) => {
      console.error( 'Parser: ', data.toString() )
    } )

    let timedOut = false

    let timeout = setTimeout( () => {
      console.log( 'Process timeout. Killing process...' )

      timedOut = true
      childProc.kill( 9 )
      reject( `Timeout: Process took longer than ${timeoutMs} ms to execute` )
    }, timeoutMs )

    childProc.on( 'close', ( code ) => {
      console.log( `Process exited with code ${code}` )

      if ( timedOut ) return // ignore `close` calls after killing (the promise was already rejected)

      clearTimeout( timeout )

      if ( code === 0 ) {
        resolve()
      } else {
        reject( `Parser exited with code ${code}` )
      }
    } )

  } )

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
