'use strict'
const root = require( 'app-root-path' )
const { getStreams, getStream, createStream, updateStream } = require( './controllers' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

const streams = require( 'express' ).Router( { mergeParams: true } )

module.exports = streams

streams.get(
  '/streams',
  authenticate( 'streams:read' ),
  getStreams )

streams.get(
  '/streams/:streamId',
  authenticate( 'streams:read' ),
  authorize,
  getStream )

streams.post(
  '/streams',
  authenticate( 'streams:write' ),
  authorize,
  createStream,
  announce( 'stream-created', 'user' ) )

streams.put(
  '/streams/:streamId',
  authenticate( 'streams:write' ),
  authorize,
  updateStream,
  announce( 'stream-updated', 'stream' ) )