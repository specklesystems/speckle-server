'use strict'
const {
  createTag,
  updateTag,
  getTagById,
  deleteTagById,
  getTagsByStreamId,
  createBranch,
  updateBranch,
  getBranchById,
  deleteBranchById,
  getBranchesByStreamId,
  getStreamReferences
} = require( './services' )

module.exports = {
  async getReferences( req, res, next ) {
    try {
      const references = await getStreamReferences( req.params.resourceId )
      res.send( references )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async getTag( req, res, next ) {
    try {
      const reference = await getTagById( req.params.referenceId )
      res.send( reference )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async createTag( req, res, next ) {
    try {
      let id = await createTag( req.body, req.params.resourceId, req.user.id )
      res.status( 201 ).send( { id: id } )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async updateTag( req, res, next ) {
    try {
      req.body.id = req.params.referenceId
      await updateTag( req.body )
      res.status( 200 ).send( { success: true } )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async deleteTag( req, res, next ) {
    try {
      await deleteTagById( req.params.referenceId )
      res.status( 200 ).send( { success: true } )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async getBranch( req, res, next ) {
    try {
      const reference = await getBranchById( req.params.referenceId )
      res.send( reference )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async createBranch( req, res, next ) {
    try {
      const id = await createBranch( req.body, req.params.resourceId, req.user.id )
      res.send( { id: id } )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async updateBranch( req, res, next ) {
    try {
      req.body.id = req.params.referenceId
      await updateBranch( req.body )
      res.status( 200 ).send( { success: true } )
    } catch ( err ) {
      next( err )
    }
  },

  async deleteBranch( req, res, next ) {
    try {
      await deleteBranchById( req.params.referenceId )
      res.send( { success: true } )
    } catch ( err ) {
      next( err )
    }
  }
}