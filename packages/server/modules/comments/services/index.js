'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Comments = () => knex( 'comments' )
const StreamComments = () => knex( 'stream_comments' )
const CommitComments = () => knex( 'commit_comments' )
const ObjectComments = () => knex( 'object_comments' )
const intersection = require( 'lodash.intersection' )

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

const getCommentsIdsForResource = async ( { id, type } ) => {
  let commentLinks
  switch ( type ) {
  case 'stream':
    commentLinks = await StreamComments().where( { stream: id } )
    break
  case 'commit':
    commentLinks = await CommitComments().where( { commit: id } )
    break
  case 'object':
    commentLinks = await ObjectComments().where( { object: id } )
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

  async getComments( { resources, limit, cursor } ) {
    // maybe since we are so streamId limited, asking for a streamId here would make sense
    // and not treat the stream as a resource
    const commentIds = await Promise.all( resources.map( r => getCommentsIdsForResource( r ) ) )

    const relevantComments = intersection( ...commentIds )
    const items = await Comments().whereIn( 'id', relevantComments ).orderBy( 'createdAt' ).limit( limit ) 
    cursor = items[items.length - 1].createdAt
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

