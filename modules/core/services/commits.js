'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Refs = ( ) => knex( 'branches' )
const BranchCommits = ( ) => knex( 'branch_commits' )

module.exports = {

  async createCommit( ) {
    
  }
}