'use strict'
const root = require( 'app-root-path' )
const { getReferences, getReference, createReference, updateReference } = require( './controllers' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

// References (branches & tags)
const references = require( 'express' ).Router( { mergeParams: true } )

module.exports = references

references.get( '/streams/:streamId/references', authenticate, authorize, getReferences )

references.get( '/streams/:streamId/references/:referenceId', authenticate, authorize, getReference )

references.post( '/streams/:streamId/references', authenticate, authorize, createReference, announce )

references.put( '/streams/:streamId/references/:referenceId', authenticate, authorize, updateReference, announce )

