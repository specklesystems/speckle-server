'use strict'
const root = require( 'app-root-path' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )
const { getCommits, getObject, getObjects, createCommit, createObjects } = require( './controllers' )

// References (branches & tags)
const objects = require( 'express' ).Router( { mergeParams: true } )

module.exports = objects

// Get all the commits
objects.get(
  '/streams/:resourceId/commits',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getCommits
)

// Create a commit
objects.post(
  '/streams/:resourceId/commits',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  createCommit
)

// Get an object
objects.get(
  '/streams/:resourceId/objects/:objectIds',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getObjects
)


// Create one or many objects (expects an array)
objects.post(
  '/streams/:resourceId/objects',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  createObjects
)