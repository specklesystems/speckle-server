const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

describe( 'GraphQL API Core', ( ) => {
  before( async ( ) => {
    await knex.migrate.latest( )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

} )