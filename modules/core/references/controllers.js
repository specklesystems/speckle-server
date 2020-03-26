'use strict'

module.exports = {
  getReferences: ( req, res, next ) => {
    res.send( [ 1, 3, 4 ] )
  },

  getReference: ( req, res, next ) => {
    res.send( { todo: true } )
  },

  createReference: ( req, res, next ) => {
    res.send( { todo: true } )
  },

  updateReference: ( req, res, next ) => {
    res.send( { todo: true } )
  }
}