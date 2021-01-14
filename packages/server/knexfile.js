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

let env = process.env
let connectionString
if ( env.SPECKLE_DB_NAME ) {
  connectionString= `postgres://${env.SPECKLE_DB_USER}:${env.SPECKLE_DB_PASSWORD}` + 
`@${env.POSTGRES_URL}/${env.SPECKLE_DB_NAME}`
}

module.exports = {
  test: {
    client: 'pg',
    connection: 'postgres://localhost/speckle2_test',
    migrations: {
      directory: migrationDirs
    },
  },
  development: {
    client: 'pg',
    connection: connectionString || 'postgres://localhost/speckle2_dev',
    migrations: {
      directory: migrationDirs
    },
  },
  production: {
    client: 'pg',
    connection: connectionString,
    migrations: {
      directory: migrationDirs
    }
  }
}
