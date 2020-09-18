'use strict'
const { authStrategies } = require( '../../index' )

module.exports = {
  ServerInfo: {
    authStrategies( parent, args, context, info ) {
      return authStrategies
    }
  }
}
