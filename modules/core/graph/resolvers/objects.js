'use strict'

module.exports = {
  Query: {
  },
  Reference: {
    __resolveType( reference, context, info ) {
      if( reference.type === "branch") return 'Branch'
      if( reference.type === "tag") return 'Tag'
    }
  }
}