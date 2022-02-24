'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Comments = () => knex( 'comments' )
const StreamComments = () => knex( 'stream_comments' )
const CommitComments = () => knex( 'commit_comments' )
const ObjectComments = () => knex( 'object_comments' )
const CommentReplies = () => knex( 'comment_replies' )

const persistResourceLinks = async ( commentId, resources ) => {
  for ( const resource of resources ) {
    switch ( resource.type ) {
    // having the type as a string here, kinda makes having two N mapping tables useless
    case 'stream':
      return await StreamComments().insert( { stream: resource.id, comment: commentId } )
    case 'commit':
      return await CommitComments().insert( { commit: resource.id, comment: commentId } )
    case 'object':
      return await ObjectComments().insert( { commit: resource.id, comment: commentId } )
    default:
      throw Error( `resource type ${resource.type} is not supported as a comment target` )
    }
  }
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

  // async archiveComment( {} ) {
  //   // TODO
  // },

  async createCommentReply( {} ) {
    // TODO
  },

  async editCommentReply( {} ) {
    // TODO
  },

  // async archiveCommentReply( {} ) {
  //   // TODO
  // },

  async getComments({ resources }) {

  },

  async getStreamComments( { streamId, limit, archived, cursor } ) {
    // TODO
    limit = limit || 25
    let raw = `SELECT * from stream_comments
      JOIN comments ON comments.id = stream_comments."comment"
      WHERE stream_comments.stream = 'a55537c38f'
      ORDER BY comments."createdAt" DESC
      LIMIT 25
      `
    let query = Comments()
      .columns( [ 'id', 'authorId', 'archived', 'createdAt', 'updatedAt', 'text', 'data' ] )
      .select()
      .join( 'stream_comments', 'comment.id', 'stream_comments.commit' )
  },

  async getCommitComments( { commitId, limit, archived, cursor } ) {
    // TODO
  },

  async getObjectComments( { objectId, limit, archived, cursor } ) {
    // TODO
  },

  async getCommentReplies( { commentId } ) {
    // TODO
  }
}

