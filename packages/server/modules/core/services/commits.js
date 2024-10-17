'use strict'
const knex = require('@/db/knex')
const { getStreamBranchByNameFactory } = require('@/modules/core/repositories/branches')
const {
  getBranchCommitsTotalCountFactory,
  getPaginatedBranchCommitsItemsFactory
} = require('@/modules/core/repositories/commits')

module.exports = {
  async getCommitsTotalCountByBranchName({ streamId, branchName }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    const getBranchCommitsTotalCount = getBranchCommitsTotalCountFactory({ db: knex })

    return getBranchCommitsTotalCount({ branchId: myBranch.id })
  },

  async getCommitsByBranchName({ streamId, branchName, limit, cursor }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    const getPaginatedBranchCommits = getPaginatedBranchCommitsItemsFactory({
      db: knex
    })
    return getPaginatedBranchCommits({ branchId: myBranch.id, limit, cursor })
  }
}
