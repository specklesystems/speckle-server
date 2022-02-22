'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Comments = () => knex( 'comments' )
const CommentReplies = () => knex( 'comments' )

module.exports = { 
  async createComment( {} ) {
    // TODO
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

