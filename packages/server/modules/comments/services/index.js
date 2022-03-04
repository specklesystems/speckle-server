'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = () => knex( 'streams' )
const Objects = () => knex( 'objects' )
const Commits = () => knex( 'commits' )
const Comments = () => knex( 'comments' )
const CommentLinks = () => knex( 'comment_links' )

const persistResourceLinks = async ( commentId, resources ) => 
  Promise.all( resources.map( res => persistResourceLink( commentId, res ) ) )

const persistResourceLink = async ( commentId, { resourceId, resourceType } ) => {
  let query
  switch ( resourceType ) {
  case 'stream':
    query = Streams()
    break
  case 'commit':
    query = Commits()
    break
  case 'object':
    query = Objects()
    break
  case 'comment':
    query = Comments()
    break
  default:
    throw Error( `resource type ${resourceType} is not supported as a comment target` )
  }
  //make sure, that the referenced resource exists
  if ( !( await query.where( { id: resourceId } ) ).length ) throw Error ( `${resourceType}: ${resourceId} doesn't exist, you cannot comment on it` )
  await CommentLinks().insert( { commentId, resourceId, resourceType } )
}

const getResourcesForComment = async ( { id } ) =>
  await CommentLinks().where( { commentId: id } )

const getCommentLinksForResources = async ( streamId, resources ) => {
  const resourceIds = resources.map( r => r.resourceId )
  let commentLinks = await CommentLinks().whereIn( 'resourceId', resourceIds )
  const objectIds = resources.filter( res => res.resourceType === 'object' ).map( r => r.resourceId )
  if ( objectIds.length ) {
    const streamObjectIds = ( await Objects().where( { streamId } ).whereIn( 'id', objectIds ) ).map( o => o.id )
    commentLinks = commentLinks.filter( link => streamObjectIds.includes( link.resourceId ) ) 
  }
  return commentLinks
} 

module.exports = { 
  async createComment( { userId, input } ) {
    let comment = { ...input }

    delete comment.resources
    delete comment.streamId

    comment.id = crs( { length: 10 } )
    comment.authorId = userId
    
    await Comments().insert( comment )
    await persistResourceLinks( comment.id, input.resources )
    
    return comment.id
  },

  async editComment( {} ) {
    // TODO
  },

  async archiveComment( {} ) {
    // TODO
  },

  async getComment( id ) {
    let [ comment ] = await Comments().where( { id } )
    return { ...comment, resources: await getResourcesForComment( comment ) }
  },

  async getComments( { streamId, resources, limit, cursor } ) {
    // maybe since we are so streamId limited, asking for a streamId here would make sense
    const commentLinks =  await getCommentLinksForResources( streamId, resources ) 
    const relevantComments = [ ...new Set( commentLinks.map( l => l.commentId ) ) ]
    let query = Comments().whereIn( 'id', relevantComments ).orderBy( 'createdAt' )
    if ( cursor ) query = query.where( 'createdAt', '>', cursor )
    let items = await query.limit( limit )
    if ( items.length ) {
      cursor = items[items.length - 1].createdAt
    } else {
      cursor = null
    }
    items = await Promise.all( items.map( async comment => ( { ...comment, resources: await getResourcesForComment( comment ) } ) ) )
    return { items, cursor, totalCount: relevantComments.length }
  }
}
