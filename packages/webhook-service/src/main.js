'use strict'

const crypto = require( 'crypto' )
const knex = require( './knex' )

const { makeNetworkRequest } = require( './webhookCaller' )

async function startTask() {
  let { rows } = await knex.raw( `
    UPDATE webhooks_events
    SET 
      "status" = 1,
      "lastUpdate" = NOW()
    FROM (
      SELECT "id" FROM webhooks_events
      WHERE "status" = 0
      ORDER BY "lastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE webhooks_events."id" = task."id"
    RETURNING webhooks_events."id"
  ` )
  return rows[0]
}

async function doTask( task ) {
  try {
    let { rows } = await knex.raw( `
      SELECT 
        ev.payload as evt,
        cnf.id as wh_id, cnf.url as wh_url, cnf.secret as wh_secret, cnf.enabled as wh_enabled
      FROM webhooks_events ev
      INNER JOIN webhooks_config cnf ON ev."webhookId" = cnf.id
      WHERE ev.id = ?
      LIMIT 1
    `, [ task.id ] )
    let info = rows[0]
    if ( !info ) {
      throw new Error( 'Internal error: DB inconsistent' )
    }

    let fullPayload = JSON.parse( info.evt )

    let postData = { payload: info.evt }

    let signature = crypto.createHmac( 'sha256', info.wh_secret || '' ).update( postData.payload ).digest( 'hex' )
    let postHeaders = { 'X-WEBHOOK-SIGNATURE': signature }

    console.log( `Callin webhook ${fullPayload.streamId} : ${fullPayload.event.event_name} at ${fullPayload.webhook.url}...` )
    let result = await makeNetworkRequest( { url: info.wh_url, data: postData, headersData: postHeaders } )

    console.log( `  Result: ${JSON.stringify( result )}` )

    if ( !result.success ) {
      throw new Error( result.error )
    }

    await knex.raw( `
      UPDATE webhooks_events
      SET
        "status" = 2,
        "lastUpdate" = NOW(),
        "statusInfo" = 'Webhook called'
      WHERE "id" = ?
    `, [ task.id ] )
  } catch ( err ) {
    await knex.raw( `
      UPDATE webhooks_events
      SET
        "status" = 3,
        "lastUpdate" = NOW(),
        "statusInfo" = ?
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
  console.log( 'Starting Webhook Service...' )
  tick()
}

main()
