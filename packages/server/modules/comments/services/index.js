'use strict'
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Comments = () => knex( 'comments' )
const StreamComments = () => knex( 'stream_comments' )
const CommitComments = () => knex( 'commit_comments' )
const ObjectComments = () => knex( 'object_comments' )
const CommentReplies = () => knex( 'comment_replies' )

module.exports = { 
  async createComment( { userId, input } ) {
    let comment = { ...input }
    delete comment.resources
    delete comment.streamId
    comment.id = crs( { length:10 } )
    comment.authorId = userId
    
    await Comments().insert( comment )
    await StreamComments().insert( { stream: input.streamId, comment: comment.id } )
    for ( let resource of input.resources ) {
      if ( resource.length === 10 ) {
        await CommitComments().insert( { commit:resource, comment: comment.id } )
      } else {
        await ObjectComments().insert( { commit:resource, comment: comment.id } )
      }
    }
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

  async editCommentReply( {} ) {
    // TODO
  },

  async archiveCommentReply( {} ) {
    // TODO
  },

  async getStreamComments( {} ) {
    // TODO
  },

  async getCommitComments( {} ) {
    // TODO
  },

  async getObjectComments( {} ) {
    // TODO
  },

  async getCommentReplies( {} ) {
    // TODO
  }
}

