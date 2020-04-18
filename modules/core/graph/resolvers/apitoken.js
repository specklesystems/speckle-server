'use strict'

module.exports = {
  Query: {},
  User: {
    apiTokens( parent ) {
      return [ { id: 'wow', name: 'mr token', lastChars: 'adsf', scopes: [ 'a', 'b' ] } ]
    }
  }
}