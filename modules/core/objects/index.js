'use strict'

const { getObjects, getObject, createObject, updateObject } = require( './controllers' )

// References (branches & tags)
const objects = require( 'express' ).Router( { mergeParams: true } )

module.exports = objects

objects.get(
  '/streams/:streamId/objects',
  getObjects
)

objects.get(
  '/streams/:streamId/objects/:objectId',
  getObject
)

objects.post(
  '/streams/:streamId/objects',
  createObject
)

object.post(
  '/streams/:streamId/commits',
  ( ) => {}
)

objects.put(
  '/streams/:streamId/objects/:objectId',
  updateObject
)