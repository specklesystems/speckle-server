const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init, startHttp } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

const { createUser, createToken } = require( '../users/services' )

describe( 'GraphQL API Core', ( ) => {
  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', username: 'd2', email: 'd.2@speckle.systems', password: 'wow' }
  let testServer
  let addr

  before( async ( ) => {
    await knex.migrate.latest( )
    let { app } = await init( )
    let { server } = await startHttp( app )
    testServer = server

    userA.id = await createUser( userA )
    userA.token = `Bearer ${(await createToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'user:read', 'token:create', 'token:read' ] ))}`
    userB.id = await createUser( userB )
    userB.token = `Bearer ${(await createToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'user:read', 'token:create', 'token:read' ] ))}`

    addr = `http://localhost:${process.env.PORT || 3000}`
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
    testServer.close()
  } )

  describe( 'Mutations', ( ) => {
    it( 'Should create a stream', async ( ) => {
      assert.fail('todo')
    } )
  } )

  describe( 'Queries', ( ) => {
    it( 'Should retrieve my profile', async ( ) => {
      const res = await chai.request( addr ).post( '/graphql' ).set( 'Authorization', userA.token ).send( {
        query: `
         {
            user {
              id 
              name
              email
            }
          }

        `
      } )
      console.log( res.body )
      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data ).to.have.property( 'user' )
      expect( res.body.data.user.name ).to.equal( 'd1' )
      expect( res.body.data.user.email ).to.equal( 'd.1@speckle.systems' )
      // console.log( res )
    } )
  } )
} )