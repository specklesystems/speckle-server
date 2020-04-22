const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const root = require( 'app-root-path' )
const { init } = require( `${root}/app` )
const knex = require( `${root}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../users/services' )
const { createStream, getStream, updateStream, deleteStream, getStreamsUser, grantPermissionsStream, revokePermissionsStream } = require( '../streams/services' )
const { createCommit, createObject, createObjects, getObject, getObjects } = require( '../objects/services' )

let sampleCommit = JSON.parse( `{
  "Objects": [
    {
      "speckle_type": "reference",
      "referencedId": "8a9b0676b7fe3e5e487bb34549e67f67"
    }
  ],
  "Description": "draft commit",
  "Parents": [
    "beb6c53c4e531f4c259a59e943dd3043"
  ],
  "CreatedOn": "2020-03-18T12:06:07.82307Z",
  "id": "79eb41764cc2c065de752bd704bfc4aa",
  "speckle_type": "Speckle.Core.Commit",
  "__tree": [
    "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67"
  ]
}` )

let sampleObject = JSON.parse( `{
  "Vertices": [],
  "id": "8a9b0676b7fe3e5e487bb34549e67f67",
  "applicationId": "test",
  "speckle_type": "Tests.Polyline"
}` )

describe( 'Objects', ( ) => {

  let userOne = {
    username: 'dim42',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie43@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    userOne.id = await createUser( userOne )
    stream.id = await createStream( stream, userOne.id )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  describe( 'Services/Queries', ( ) => {

    before( async ( ) => {

    } )

    it( 'Should create a commit', async ( ) => {
      let myId = await createCommit( stream.id, userOne.id, sampleCommit )
      expect( myId ).to.not.be.null
    } )

    it( 'Should create objects', async ( ) => {
      sampleObject.id = await createObject( sampleObject )
      sampleCommit.id = await createObject( sampleCommit )
    } )

    let objCount_1 = 10
    let objCount_2 = 1000
    let objs = [ ]
    let objs2 = [ ]

    it( `Should create ${objCount_1} objects`, async ( ) => {
      for ( let i = 0; i < objCount_1; i++ ) {
        objs.push( {
          amazingness: i * i,
          somethingness: `Sample ${i%2===0 ? 'SUPER MEGA' : '1010101000010101'} ERRR`,
          __tree: [
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67",
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67" + i / 2.0,
            "79eb41764cc2c065de752bd704bfc4aa." + i + "." + i * i,
          ]
        } )
      }

      let ids = await createObjects( objs )

      expect( ids ).to.have.lengthOf( objCount_1 )

    } ).timeout( 30000 )

    it( `Should create ${objCount_2} objects`, async ( ) => {
      for ( let i = 0; i < objCount_2; i++ ) {
        objs2.push( {
          amazingness: i * i,
          somethingness: `Sample HASH ${i%2===0 ? 'SUPER MEGA HASH CHANGE' : '100101'} ERRR`,
          x: 10,
          y: i * 2,
          z: i * 0.23432,
          random: { blargh: 'A a auctor arcu id enim felis, luctus sed sit lacus enim phasellus ultricies, quis fermentum, platea placerat vel integer. Enim urna natoque eros id volutpat voluptatum, vitae pede nec in nam. In libero nullam, habitasse auctor a laoreet justo. Vestibulum enim laoreet quis magna in. Non pharetra sit semper vitae ac fusce, non nisl molestie porttitor leo sed, quam vulputate, suscipit sed elit fringilla justo viverra, mattis dignissim ullamcorper a in. Pellentesque velit posuere ipsum, eu pharetra. Magna ac orci sit, malesuada lacinia mauris sed sunt ac neque. Mollis volutpat cras a, donec ac, etiam commodo id fringilla et tempor mi, pellentesque lacus ac morbi ultrices. Diam amet felis aliquam nibh nunc sed. Rhoncus malesuada in malesuada proin sed nam, viverra ante sollicitudin eu augue risus nisl, velit interdum vivamus dictumst. Phasellus fusce wisi non ipsum elit gravida. Nunc scelerisque, interdum adipiscing quam integer commodo, modi tempor sociis sociosqu dui nullam.A a auctor arcu id enim felis, luctus sed sit lacus enim phasellus ultricies, quis fermentum, platea placerat vel integer. Enim urna natoque eros id volutpat voluptatum, vitae pede nec in nam. In libero nullam, habitasse auctor a laoreet justo. Vestibulum enim laoreet quis magna in. Non pharetra sit semper vitae ac fusce, non nisl molestie porttitor leo sed, quam vulputate, suscipit sed elit fringilla justo viverra, mattis dignissim ullamcorper a in. Pellentesque velit posuere ipsum, eu pharetra. Magna ac orci sit, malesuada lacinia mauris sed sunt ac neque. Mollis volutpat cras a, donec ac, etiam commodo id fringilla et tempor mi, pellentesque lacus ac morbi ultrices. Diam amet felis aliquam nibh nunc sed. Rhoncus malesuada in malesuada proin sed nam, viverra ante sollicitudin eu augue risus nisl, velit interdum vivamus dictumst. Phasellus fusce wisi non ipsum elit gravida. Nunc scelerisque, interdum adipiscing quam integer commodo, modi tempor sociis sociosqu dui nullam.Lorem ipsum dolor sit amet, lorem scelerisque curabitur elementum eligendi, sed ut nibh. Nullam ac ut proin tortor tortor, ultrices odio litora eu, at lectus. Nulla et est, donec at, rutrum massa eros elit nisl sed, integer amet fusce tempus phasellus aliquam posuere, molestie adipiscing quas magnis convallis tellus. Exercitation purus aliquam, tortor pellentesque. Consequat arcu quis eros, turpis ultrices tempor elementum, platea cursus dignissim nulla. Ultrices vestibulum sit et taciti ut, nunc interdum. In eleifend amet sed a tortor, sed condimentum pede nam magna, nisl nam tristique pede ut at, eleifend sit ac vitae orci, nec wisi vestibulum tortor facilisis. Cras nunc debitis duis placerat curabitur, conubia vel ullamcorper vestibulum morbi donec, molestie rutrum.Cras elit ut, quis diam sed sollicitudin morbi rhoncus, ante velit, at ipsum debitis. Ut ipsum, et sed morbi odio libero viverra eget, nihil blandit nonummy mauris. Et sed nisl fermentum nunc sapien erat, dolor mattis pellentesque nec sapien faucibus, praesent lectus odio rhoncus id dolor, velit at lorem iaculis condimentum. Id suscipit amet nec rutrum, erat magnis amet id, lacus tristique. Neque id mauris dapibus consectetuer ut scelerisque, tincidunt fringilla quis dolores, praesent ipsum, nec tortor ultricies, posuere a fusce et magna.' },
          __tree: [
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f6723",
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e623237f67" + i / 2.0,
            "79eb41764cc2c065de752bd704asdf4aa." + i + "." + i * i,
            "79eb41764cc2c065de752bd704bfc4aa." + i + "." + i * i + 3,
          ]
        } )
      }

      let myIds = await createObjects( objs2 )

      myIds.forEach( ( h, i ) => objs2[ i ].id = h )

      expect( myIds ).to.have.lengthOf( objCount_2 )

    } ).timeout( 30000 )

    it( 'Should get a single object', async ( ) => {

      let obj = await getObject( sampleCommit.id )
      expect( obj ).to.not.be.null
      expect( obj.data ).to.deep.equal( sampleCommit )
    } )

    it( 'Should get more objects', async ( ) => {
      let myObjs = await getObjects( objs.map( o => o.id ) )
      expect( myObjs ).to.have.lengthOf( objs.length )

      let match1 = myObjs.find( o => o.id === objs[ 0 ].id )
      expect( match1 ).to.not.be.null
      expect( match1.id ).to.equal( objs[ 0 ].id )

      let match2 = myObjs.find( o => o.id === objs[ 2 ].id )
      expect( match2 ).to.not.be.null
      expect( match2.id ).to.equal( objs[ 2 ].id )
    } )

  } )

  describe( 'Integration (API)', ( ) => {

    let app
    let userA = { username: 'A', name: 'DimitrieA ', email: 'didimitrie+a@gmail.com', password: 'sn3aky-1337-b1m' }
    let tokenA
    let publicStream = { name: 'Some Nice Stream', isPublic: true }
    let baseUrl

    before( async ( ) => {
      app = init( )
      userA.id = await createUser( userA )
      tokenA = await createToken( userA.id, 'Generic Token', [ 'streams:read', 'streams:write' ] )
      publicStream.id = await createStream( publicStream, userA.id )
      baseUrl = `/streams/${publicStream.id}`
    } )

    it( 'Should create a commit (or more)', async ( ) => {
      const firstCommitRes = await chai.request( app ).post( `${baseUrl}/commits` ).send( sampleCommit ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( firstCommitRes ).to.have.status( 201 )

      let secondCommit = { ...sampleCommit }
      secondCommit.description = "Something else"
      delete secondCommit.id

      const secondCommitRes = await chai.request( app ).post( `${baseUrl}/commits` ).send( secondCommit ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( secondCommitRes ).to.have.status( 201 )

    } )

    it( 'Should get all stream commits', async ( ) => {
      const commits = await chai.request( app ).get( `${baseUrl}/commits` ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( commits ).to.have.status( 200 )
      expect( commits.body ).to.have.lengthOf( 2 )
      expect( commits.body[ 0 ] ).to.have.property( 'id' )
      expect( commits.body[ 0 ] ).to.have.property( 'speckle_type' )
      expect( commits.body[ 0 ].speckle_type ).to.equal( 'commit' )
    } )

    let objs = [ ]
    let objCount = 1000

    it( 'Should create objects', async ( ) => {
      for ( let i = 0; i < objCount; i++ ) {
        objs.push( {
          amazingness: i * i,
          somethingness: `API ${i%2===0 ? 'SUPER MEGA' : '1010101000010101'} ERRR`
        } )
      }

      const objectCreationResult = await chai.request( app ).post( `${baseUrl}/objects` ).send( objs ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( objectCreationResult ).to.have.status( 201 )
      expect( objectCreationResult.body ).to.have.lengthOf( objCount )

      objs.forEach( ( o, i ) => o.id = objectCreationResult.body[ i ] )
    } )

    it( 'Should get 10 objects', async ( ) => {
      const url = `${baseUrl}/objects/${objs.slice(0,10).map( o => o.id ).join( )}`
      const objsResult = await chai.request( app ).get( url ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( objsResult ).to.have.status( 200 )
      expect( objsResult.body ).to.have.lengthOf( 10 )
      expect( objsResult.body[ 0 ] ).to.have.property( 'id' )
    } )

    it( 'Should get many objects', async ( ) => {
      const objsResult = await chai.request( app ).post( `${baseUrl}/objects/getmany` ).send( objs.map( o => o.id ) ).set( 'Authorization', `Bearer ${tokenA}` )
      expect( objsResult ).to.have.status( 200 )
      expect( objsResult.body ).to.have.lengthOf( objCount )
      expect( objsResult.body[ 0 ] ).to.have.property( 'id' )
    } )

  } )

} )