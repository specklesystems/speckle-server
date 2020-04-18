'use strict'

module.exports = {
  Query: {
    user( parent, args, context, info ) {
      return { id: 'test', username: 'best', email: 'funky', name:'barg' }
    }
  }
}