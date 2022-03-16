'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = () => knex( 'streams' )
const Objects = () => knex( 'objects' )
const Branches = ( ) => knex( 'branches' )
const Commits = () => knex( 'commits' )
const Comments = () => knex( 'comments' )
const CommentLinks = () => knex( 'comment_links' )
const CommentViews = () => knex( 'comment_views' )

const persistResourceLinks = async ( commentId, resources ) => 
  await Promise.all( resources.map( res => persistResourceLink( commentId, res ) ) )

const persistResourceLink = async ( commentId, { resourceId, resourceType } ) => {
  //should the resource belonging to the stream stuff be validated here?
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

const getResourcesForComment = async ( { id } ) => await CommentLinks().where( { commentId: id } )

const getCommentLinksForResources = async ( streamId, resources ) => {
  const resourceIds = resources.map( r => r.resourceId )
  let commentLinks = await CommentLinks().whereIn( 'resourceId', resourceIds )
  const objectIds = resources.filter( res => res.resourceType === 'object' ).map( r => r.resourceId )
  if ( objectIds.length ) {
    const streamObjectIds = ( await Objects().where( { streamId } ).whereIn( 'id', objectIds ) ).map( o => o.id )
    // if a comment link is of type object, check if the object belongs to the stream, other types do not need filtering
    // since all other types are directly linked to a stream
    commentLinks = commentLinks.filter( link => link.resourceType === 'object' ? streamObjectIds.includes( link.resourceId ) : true ) 
  }

  // group comment links by comment ids, so that the resources can be filtered below
  let commentGroups = {}
  for ( const link of commentLinks ) {
    if ( !( link.commentId in commentGroups ) ) commentGroups[link.commentId] = []
    commentGroups[link.commentId].push( link.resourceId )
  }

  const relevantCommentIds = Object
    .keys( commentGroups )
    .filter( 
      // make sure, that the given comment targets exactly the same set of resources, as the input requested 
      commentId => commentGroups[commentId].length === resourceIds.length && resourceIds.every( resId => commentGroups[commentId].includes( resId ) )
    )
  return commentLinks.filter( l => relevantCommentIds.includes( l.commentId ) )
} 

module.exports = { 
  async createComment( { userId, input } ) {
    if ( input.resources.length < 1 ) throw Error( 'Must specify at least one resource as the comment target' )

    const streamResources = input.resources.filter( r => r.resourceType === 'stream' )
    if ( streamResources.length > 1 ) throw Error( 'Commenting on multiple streams is not supported' )
    
    const [ stream ] = streamResources
    if ( stream.resourceId !== input.streamId ) throw Error( 'Input streamId doesn\'t match the stream resource.resourceId' )

    const commentResource = input.resources.find( r => r.resourceType === 'comment' )

    let comment = { ...input }

    delete comment.resources
    delete comment.streamId

    comment.id = crs( { length: 10 } )
    comment.authorId = userId
    
    await Comments().insert( comment )
    await persistResourceLinks( comment.id, input.resources )
    
    if ( commentResource ) {
      await Comments().where( { id: commentResource.resourceId } ).update( { updatedAt: knex.fn.now( ) } )
    }
    
    await module.exports.viewComment( { userId, commentId: comment.id } ) // so we don't self mark a comment as unread the moment it's created
    return comment.id
  },

  async createCommentReply( { authorId, parentCommentId, text, data } ) {
    let comment = { id: crs( { length: 10 } ), authorId, text, data }
    await Comments().insert( comment )
    await persistResourceLink( comment.id, { resourceId: parentCommentId, resourceType: 'comment' } )
    await Comments().where( { id: parentCommentId } ).update( { updatedAt: knex.fn.now( ) } )

    return comment.id
  },

  async editComment( {} ) {
    // TODO
  },

  async viewComment( { userId, commentId } ) {
    let query = CommentViews().insert( { commentId: commentId, userId: userId, viewedAt: knex.fn.now() } )
      .onConflict( knex.raw( '("commentId","userId")' ) )
      .merge()
    await query
  },

  async archiveComment( { commentId, archived = true } ) {
    return await Comments().where( { id: commentId } ).update( { archived } )
  },

  async getComment( { id, userId = null } ) {
    let query = Comments().select( '*' )
      .joinRaw( `
        join(
          select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
          from comment_links cl
          join comments on comments.id = cl."commentId"
          group by cl."commentId"
        ) res using(id)` 
      )
    if ( userId ) {
      query.leftOuterJoin( 'comment_views', b => {
        b.on( 'comment_views.commentId', '=', 'comments.id' )
        b.andOn( 'comment_views.userId', '=', knex.raw( '?', userId ) )
      } )
    }
    query.where( { id } ).first()
    let res = await query
    return res
  },

  async getComments2( { streamId, resources, limit, cursor, archived = false } ) {
    // maybe since we are so streamId limited, asking for a streamId here would make sense
    const commentLinks =  await getCommentLinksForResources( streamId, resources ) 
    const relevantComments = [ ...new Set( commentLinks.map( l => l.commentId ) ) ]
    let query = Comments().whereIn( 'id', relevantComments ).orderBy( 'createdAt' )
    if ( cursor ) query = query.where( 'createdAt', '>', cursor.toISOString() )

    if ( !archived ) query = query.andWhere( { archived } )
    const defaultLimit = 100
    let items = await query.limit( limit ?? defaultLimit )
    if ( items.length ) {
      cursor = items[items.length - 1].createdAt
    } else {
      cursor = null
    }
    items = await Promise.all( items.map( async comment => ( { ...comment, resources: await getResourcesForComment( comment ) } ) ) )
    return { items, cursor, totalCount: relevantComments.length }
  },

  async getComments( { resources, limit, cursor, userId = null, replies = false, archived = false } ) {
    let query = knex.with( 'comms', cte => {
      cte.select( '*' ).from( 'comments' )
      cte.join( 'comment_links', 'comments.id', '=', 'commentId' )
      
      if ( userId ){
        // link viewed At
        cte.leftOuterJoin( 'comment_views', b => {
          b.on( 'comment_views.commentId', '=', 'comments.id' )
          b.andOn( 'comment_views.userId', '=', knex.raw( '?', userId ) )
        } )
      }

      cte.where( q => {
        // link resources
        for ( let res of resources ) {
          q.orWhere( 'comment_links.resourceId', '=', res.resourceId )
        }
      } )
      if ( !replies ) {
        cte.whereNull( 'parentComment' )
      }
      cte.where( 'archived', '=', false )
    } )

    query.select( '*' ).from( 'comms' )
    
    // total count coming from our cte
    query.joinRaw( 'right join (select count(*) from comms) c(total_count) on true' )
    
    // get comment's all linked resources
    query.joinRaw( `
      join(
        select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
        from comment_links cl
        join comms on comms.id = cl."commentId"
        group by cl."commentId"
      ) res using(id)`
    )

    if ( cursor ) {
      query.where( 'createdAt', '<', cursor )
    }

    query.orderBy( 'createdAt', 'desc' )
    query.limit( limit ?? 10 )
    
    let rows = await query
    let totalCount = rows && rows.length > 0 ? parseInt( rows[0].total_count ) : 0
    let nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

    return {
      items: rows,
      cursor: nextCursor,
      totalCount
    }
  }

}
