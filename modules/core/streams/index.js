'use strict'
const root = require( 'app-root-path' )
const { getStreams, getStream, createStream, updateStream, deleteStream, grantPermissions, revokePermissions, getStreamUsers } = require( './controllers' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

const streams = require( 'express' ).Router( { mergeParams: true } )

module.exports = streams

streams.get(
  '/streams',
  authenticate( 'streams:read' ),
  getStreams
)

streams.get(
  '/streams/:resourceId',
  authenticate( 'streams:read', false ),
  authorize( 'stream_acl', 'streams', 'read' ),
  getStream
)

streams.post(
  '/streams',
  authenticate( 'streams:write' ),
  createStream,
  announce( 'stream-created', 'user' )
)

streams.put(
  '/streams/:resourceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  updateStream,
  announce( 'stream-updated', 'stream' )
)

streams.delete(
  '/streams/:resourceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'owner' ),
  deleteStream,
  announce( 'stream-deleted', 'stream' )
)

streams.post(
  '/streams/:resourceId/users',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'owner' ),
  grantPermissions,
  announce( 'stream-created', 'user' )
)

streams.get(
  '/streams/:resourceId/users',
  authenticate( 'streams:read' ),
  authorize( 'stream_acl', 'streams', 'read' ),
  getStreamUsers
)

streams.delete(
  '/streams/:resourceId/users',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'owner' ),
  revokePermissions,
  announce( 'stream-deleted', 'user' )
)

// console.log( streams.stack )