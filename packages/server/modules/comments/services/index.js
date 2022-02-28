'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Comments = () => knex( 'comments' )
const StreamComments = () => knex( 'stream_comments' )
const CommitComments = () => knex( 'commit_comments' )
const ObjectComments = () => knex( 'object_comments' )

const persistResourceLinks = async ( commentId, resources ) => {
  for ( const resource of resources ) {
    switch ( resource.type ) {
    // having the type as a string here, kinda makes having two N mapping tables useless
    case 'stream':
      await StreamComments().insert( { stream: resource.id, comment: commentId } )
      break
    case 'commit':
      await CommitComments().insert( { commit: resource.id, comment: commentId } )
      break
    case 'object':
      await ObjectComments().insert( { object: resource.id, comment: commentId } )
      break
    default:
      throw Error( `resource type ${resource.type} is not supported as a comment target` )
    }
  }
}

const getResourcesForComment = async ( { id } ) => {
  // check if comment exists at all
  const resources = [
    ( await StreamComments().where( { comment: id } ) ).map( commentLink => ( { id:commentLink.stream, type: 'stream' } ) ),
    ( await CommitComments().where( { comment: id } ) ).map( commentLink => ( { id:commentLink.commit, type: 'commit' } ) ),
    ( await ObjectComments().where( { comment: id } ) ).map( commentLink => ( { id:commentLink.object, type: 'object' } ) )
    // insert the parent comment here too if applicable?
  ].flat()
  return resources
}
const getCommentsIdsForResource = async ( streamId, { id, type } ) => {
  let commentLinks
  switch ( type ) {
  case 'stream':
    throw Error( 'Stream level comments are not supported ATM' )
    // commentLinks = streamComments
    break
  case 'commit':
    commentLinks = await CommitComments().where( { commit: id } )
    break
  case 'object':
    commentLinks = await ObjectComments()
      .join( 'stream_comments', 'object_comments.comment', 'stream_comments.comment' )
      .where( { object: id, stream: streamId } )
    break
  case 'comment':
    commentLinks = await Comments().returning( 'id' ).where( { parentComment: id } )
    break
  default:
    throw Error( `No comments are supported for ${resource.type}` )
  }
  return commentLinks.map( l => l.comment )
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

  async createCommentReply( {} ) {
    // TODO
  },

  // async editCommentReply( {} ) {
  //   // TODO
  // },

  // async archiveCommentReply( {} ) {
  //   // TODO
  // },
  async getComment( id ) {
    const [ comment ] = await Comments().where( { id } )
    return comment
  },

  async getComments( { streamId, resources, limit, cursor } ) {
    // maybe since we are so streamId limited, asking for a streamId here would make sense
    // and not treat the stream as a resource
    const commentIds = await Promise.all( resources.map( res => getCommentsIdsForResource( streamId, res ) ) )

    const relevantComments = [ ...new Set( commentIds.flat() ) ]
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
  },

  // async getStreamComments( { streamId, limit, archived, cursor } ) {
  //   // TODO
  //   limit = limit || 25
  //   let raw = `SELECT * from stream_comments
  //     JOIN comments ON comments.id = stream_comments."comment"
  //     WHERE stream_comments.stream = 'a55537c38f'
  //     ORDER BY comments."createdAt" DESC
  //     LIMIT 25
  //     `
  //   let query = Comments()
  //     .columns( [ 'id', 'authorId', 'archived', 'createdAt', 'updatedAt', 'text', 'data' ] )
  //     .select()
  //     .join( 'stream_comments', 'comment.id', 'stream_comments.commit' )
  // },

  // async getCommitComments( { commitId, limit, archived, cursor } ) {
  //   // TODO
  // },

  // async getObjectComments( { objectId, limit, archived, cursor } ) {
  //   // TODO
  // },

  // async getCommentReplies( { commentId } ) {
  //   // TODO
  // }
}

