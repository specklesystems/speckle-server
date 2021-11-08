/* istanbul ignore file */
const chai = require( 'chai' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect

// NOTE:
// These tests check that the initialization routine of the whole server
// correctly registers some scopes and roles. At the time of writing, there are
// 11 scopes and 5 roles. These might increase in the future with additional
// modules being added.
describe( 'Initialization Logic @init-logic', ( ) => {
  describe( 'First init', ( ) => {
    before( async ( ) => {
      await init()
    } )

    after( async ( ) => {
      // no rollback here!
    } )

    it( 'should have a lotta scopes', async() => {
      let res = await knex( 'scopes' ).select()
      expect( res.length ).to.be.greaterThan( 10 )
    } )

    it( 'should have some roles', async() => {
      let res = await knex( 'user_roles' ).select()
      expect( res.length ).to.be.greaterThan( 4 )
    } )

    it( 'should have some apps', async() => {
      let res = await knex( 'server_apps' ).select()
      expect( res.length ).to.be.greaterThan( 2 )
    } )
  } )

  describe( 'Second init', ( ) => {
    before( async ( ) => {
      await init()
    } )

    after( async ( ) => {
      await knex.migrate.rollback() // we rollback here :)
    } )

    it( 'should have a lotta scopes second time round too!', async() => {
      let res = await knex( 'scopes' ).select()
      expect( res.length ).to.be.greaterThan( 10 )
    } )

    it( 'should have some roles second time round!', async() => {
      let res = await knex( 'user_roles' ).select()
      expect( res.length ).to.be.greaterThan( 4 )
    } )

    it( 'should have some apps second time round', async() => {
      let res = await knex( 'server_apps' ).select()
      expect( res.length ).to.be.greaterThan( 2 )
    } )
  } )
} )
