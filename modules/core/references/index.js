'use strict'
const root = require( 'app-root-path' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

const {
  getReferences,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require( './controllers' )

// References (branches & tags)
const references = require( 'express' ).Router( { mergeParams: true } )

module.exports = references

// Get all branches and tags for a stream
references.get(
  '/streams/:resourceId/references',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getReferences
)

/*
    Tags
 */

// Get specific tag
references.get(
  '/streams/:resourceId/tags/:referenceId',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getTag
)

// Create a tag
references.post(
  '/streams/:resourceId/tags',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  createTag,
  announce( 'reference-created', 'stream' )
)

// Edit a tag
references.put(
  '/streams/:resourceId/tags/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  updateTag,
  announce( 'reference-updated', 'stream' )
)

// Delete a tag
references.delete(
  '/streams/:resourceId/tags/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  deleteTag,
  announce( 'reference-deleted', 'stream' )
)

/*
    Branches
 */

// Get specific branch
references.get(
  '/streams/:resourceId/branches/:referenceId',
  authenticate( 'streams:read', false ),
  authorize( 'streams_acl', 'streams', 'read' ),
  getBranch
)

// Create a branch
references.post(
  '/streams/:resourceId/branches',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  createBranch,
  announce( 'reference-created', 'stream' )
)

// Edit a branch
references.put(
  '/streams/:resourceId/branches/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  updateBranch,
  announce( 'reference-updated', 'stream' )
)

// Delete a branch
references.delete(
  '/streams/:resourceId/branches/:referenceId',
  authenticate( 'streams:write' ),
  authorize( 'stream_acl', 'streams', 'write' ),
  deleteBranch,
  announce( 'reference-deleted', 'stream' )
)