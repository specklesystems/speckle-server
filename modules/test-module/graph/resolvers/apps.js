'use strict'
const root = require( 'app-root-path' )
const { getApp } = require( '../../services/apps' )

module.exports = {
  Query: {
    async serverApp( parent, args, context, info ) {
      return await getApp( { id: args.id } )
    }
  }
}