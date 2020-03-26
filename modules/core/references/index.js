'use strict'

const { getReferences, getReference, createReference, updateReference } = require( './controllers' )

// References (branches & tags)
const references = require( 'express' ).Router( { mergeParams: true } )

references.get( '/streams/:streamId/references', getReferences )

references.get( '/streams/:streamId/references/:referenceId', getReference )

references.post( '/streams/:streamId/references', createReference )

references.put( '/streams/:streamId/references/:referenceId', updateReference )

module.exports = references