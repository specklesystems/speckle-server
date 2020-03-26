const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

const { createActor, getActor, updateActor, deleteActor } = require( '../queries/actors' )

describe( 'Actors', ( ) => {
  before( async ( ) => {
    await knex.migrate.latest( )
    app = init( )
  } )

  after( async ( ) => {
    // await knex.migrate.rollback( )
  } )

  describe( 'CRUD', ( ) => {
    let myTestActor = {
      username: 'dim',
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie@gmail.com'
    }

    it( 'Should create an actor', async ( ) => {
      let actor = await createActor( myTestActor )
      myTestActor.id = actor.id
    } )

    it( 'Should get an actor', async ( ) => {
      let actor = await getActor( myTestActor.id )
    } )

    it( 'Should update an actor', async ( ) => {
      myTestActor.username = "dimitrie"
      let actor = await updateActor( myTestActor )
    } )

  } )

} )