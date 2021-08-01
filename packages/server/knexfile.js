/* istanbul ignore file */
'use strict'
const fs = require( 'fs' )
const path = require( 'path' )
const appRoot = require( 'app-root-path' )

// Load up .ENV file

require( 'dotenv' ).config( { path: `${appRoot}/.env` } )

function walk( dir ) {
  let results = [ ]
  let list = fs.readdirSync( dir )
  list.forEach( function ( file ) {
    let fullFile = path.join( dir, file )
    let stat = fs.statSync( fullFile )
    if ( stat && stat.isDirectory( ) ) {
      if ( file === 'migrations' )
        results.push( fullFile )
      else
        results = results.concat( walk( fullFile ) )
    }
  } )
  return results
}

let migrationDirs = walk( './modules' )

// this is for readability, many users struggle to set the postgres connection uri
// in the env variables. This way its a bit easier to understand, also backward compatible.
let env = process.env
let connectionUri
if ( env.POSTGRES_USER && env.POSTGRES_PASSWORD ) {
  connectionUri = `postgres://${encodeURIComponent( env.POSTGRES_USER )}:${encodeURIComponent( env.POSTGRES_PASSWORD )}@${env.POSTGRES_URL}/${encodeURIComponent( env.POSTGRES_DB )}`
} else {
  connectionUri = env.POSTGRES_URL
}

module.exports = {
  test: {
    client: 'pg',
    connection: connectionUri || 'postgres://localhost/speckle2_test',
    migrations: {
      directory: migrationDirs
    },
  },
  development: {
    client: 'pg',
    connection: connectionUri || 'postgres://localhost/speckle2_dev',
    migrations: {
      directory: migrationDirs
    },
  },
  production: {
    client: 'pg',
    connection: connectionUri,
    migrations: {
      directory: migrationDirs
    },
    pool: { min: 2, max: 4 }
  }
}
