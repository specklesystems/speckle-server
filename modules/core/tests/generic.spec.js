const chai = require( 'chai' )
const assert = require( 'assert' )

const root = require( 'app-root-path' )
const { init } = require( `${root}/app` )
const knex = require( `${root}/db/knex` )

const expect = chai.expect

const { contextApiTokenHelper, validateScopes, authorizeResolver } = require( '../../shared' )

describe( 'Generic AuthN & AuthZ controller tests', ( ) => {

  it( 'Validate scopes', async ( ) => {
    try {
      await validateScopes( )
      assert.fail( 'Should have thrown an error with invalid input' )
    } catch ( e ) {
      // 
    }

    try {
      await validateScopes( [ 'a' ], 'b' )
      assert.fail( 'Should have thrown an error' )
    } catch ( e ) {
      // 
    }

    await validateScopes( [ 'a', 'b' ], 'b' ) // should pass
  } )

  it( 'Should create proper context', async ( ) => {
    let res = await contextApiTokenHelper( { req: { headers: { authorization: 'Bearer BS' } } } )
    expect( res.auth ).to.equal( false )

    let res2 = await contextApiTokenHelper( { req: { headers: { authorization: null } } } )
    expect( res2.auth ).to.equal( false )

    let res3 = await contextApiTokenHelper( { req: { headers: { authorization: undefined } } } )
    expect( res3.auth ).to.equal( false )
  } )

  it( 'Resolver Authorization Should fail nicely when roles & resources are wanky', async ( ) => {

    try {
      let res = await authorizeResolver( null, 'foo', 'bar' )
      assert.fail( 'resolver authorization should have thrown' )
    } catch ( e ) {

    }

    try {
      let res = await authorizeResolver( 'foo', 'bar', 'streams:read' )
      assert.fail( 'resolver authorization should have thrown' )
    } catch ( e ) {

    }

  } )

} )