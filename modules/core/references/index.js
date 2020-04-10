'use strict'
const root = require( 'app-root-path' )
const { getReferences, getReference, createReference, updateReference, deleteReference } = require( './controllers' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

// References (branches & tags)
const references = require( 'express' ).Router( { mergeParams: true } )

module.exports = references

// Get all branches and tags
references.get(
  '/streams/:resourceId/references',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getReferences
)

// Get specific tag or branch
references.get(
  '/streams/:streamId/references/:referenceId',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getReference
)

// Create a branch or a tag
references.post(
  '/streams/:streamId/references',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  createReference,
  announce( 'reference-created', 'stream' )
)

// Edit a branch or a tag
references.put(
  '/streams/:streamId/references/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  announce( 'reference-updated', 'stream' )
)

references.delete(
  '/streams/:streamId/references/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  deleteReference,
  announce( 'reference-deleted', 'stream' )
)