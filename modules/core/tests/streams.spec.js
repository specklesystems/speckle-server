const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

describe( 'Streams', ( ) => {

  let app = null

  before( async ( ) => {
    // await knex.migrate.rollback( )
    await knex.migrate.latest( )
    app = init( )
  } )

  after( async ( ) => {
    // await knex.migrate.rollback( )

  } )

  describe( 'CRUD', ( ) => {

    let myTestStream = { name: 'woowowo', id: 'noids', description: 'wonderful test stream' }

    it( 'Should create a stream', async ( ) => {
      const res = await chai.request( app ).post( '/streams' ).send( myTestStream )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )
    } )

    it( 'Should get a stream', async ( ) => {
      const res = await chai.request( app ).get( `/streams/${myTestStream.id}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )
      expect( res.body ).to.have.property( 'name' )
    } )

    it( 'Should update a stream', async ( ) => {
      const res = await chai.request( app ).put( `/streams/${myTestStream.id}` ).send( { name: 'new name' } )
      const resUpdated = await chai.request( app ).get( `/streams/${myTestStream.id}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )

      expect( resUpdated ).to.have.status( 200 )
      expect( resUpdated ).to.have.property( 'name' )
      expect( resUpdated.name ).to.equal( 'new name' )
    } )

    it( 'Should delete a stream', async ( ) => {
      assert.fail( )
    } )



  } )

} )