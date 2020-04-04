'use strict'

module.exports = {
  getObjects: ( req, res, next ) => {
    res.send( [ 1, 3, 4 ] )
  },

  getObject: ( req, res, next ) => {
    res.send( { todo: true } )
  },

  createObject: ( req, res, next ) => {
    res.send( { todo: true } )
  },

  updateObject: ( req, res, next ) => {
    res.send( { todo: true } )
  }
}