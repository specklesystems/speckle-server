const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

const { createUser, getUser, updateUser, deleteUser, createToken, revokeToken } = require( '../users/queries' )

describe( 'Actors & Tokens', ( ) => {
  let myTestActor = {
    username: 'dim',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com'
  }

  before( async ( ) => {
    await knex.migrate.latest( )

    let actorId = await createUser( myTestActor )
    myTestActor.id = actorId

    app = init( )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  describe( 'Services/Queries', ( ) => {

    it( 'Should create an actor', async ( ) => {
      let newUser = { ...myTestActor }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.username = 'bill'
      newUser.password = 'testthebest'

      let actor = await createUser( newUser )
      newUser.id = actor.id
    } )

    it( 'Should get an actor', async ( ) => {
      let actor = await getUser( myTestActor.id )

    } )

    it( 'Should update an actor', async ( ) => {
      let updatedActor = { ...myTestActor }
      updatedActor.username = 'didimitrie'

      await updateUser( myTestActor.id, updatedActor )

      let actor = await getUser( myTestActor.id )
      expect( actor.username ).to.equal( updatedActor.username )
      // assert.equal( myTestActor.username, actor.username )
    } )

    it( 'Should create an api_token', async ( ) => {
      assert.fail( )
    } )

    it( 'Should revoke an api_token', async ( ) => {
      assert.fail( )

    } )

  } )

} )