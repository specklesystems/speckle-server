'use strict'
const crypto = require('crypto')
const crs = require('crypto-random-string')
const bcrypt = require('bcrypt')
const { chunk } = require('lodash')
const { logger: parentLogger } = require('../observability/logging')

const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')

const tables = (db) => ({
  objects: db('objects'),
  closures: db('object_children_closure'),
  branches: db('branches'),
  streams: db('streams'),
  apiTokens: db('api_tokens'),
  tokenScopes: db('token_scopes')
})

module.exports = class ServerAPI {
  constructor({ db, streamId, logger }) {
    this.tables = tables(db)
    this.db = db
    this.streamId = streamId
    this.isSending = false
    this.buffer = []
    this.logger =
      logger ||
      Observability.extendLoggerComponent(parentLogger.child({ streamId }), 'ifc')
  }

  async saveObject(obj) {
    if (!obj) throw new Error('Null object')

    if (!obj.id) {
      obj.id = crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex')
    }

    await this.createObject({ streamId: this.streamId, object: obj })

    return obj.id
  }

  async saveObjectBatch(objs) {
    return await this.createObjectsBatched(this.streamId, objs)
  }

  async createObject({ streamId, object }) {
    const insertionObject = this.prepInsertionObject(streamId, object)

    const closures = []
    const totalChildrenCountByDepth = {}
    if (object.__closure !== null) {
      for (const prop in object.__closure) {
        closures.push({
          streamId,
          parent: insertionObject.id,
          child: prop,
          minDepth: object.__closure[prop]
        })

        if (totalChildrenCountByDepth[object.__closure[prop].toString()])
          totalChildrenCountByDepth[object.__closure[prop].toString()]++
        else totalChildrenCountByDepth[object.__closure[prop].toString()] = 1
      }
    }

    delete insertionObject.__tree
    delete insertionObject.__closure

    insertionObject.totalChildrenCount = closures.length
    insertionObject.totalChildrenCountByDepth = JSON.stringify(
      totalChildrenCountByDepth
    )

    await this.tables.objects.insert(insertionObject).onConflict().ignore()

    if (closures.length > 0) {
      await this.tables.closures.insert(closures).onConflict().ignore()
    }

    return insertionObject.id
  }

  async createObjectsBatched(streamId, objects) {
    const closures = []
    const objsToInsert = []
    const ids = []

    // Prep objects up
    objects.forEach((obj) => {
      const insertionObject = this.prepInsertionObject(streamId, obj)
      let totalChildrenCountGlobal = 0
      const totalChildrenCountByDepth = {}

      if (obj.__closure !== null) {
        for (const prop in obj.__closure) {
          closures.push({
            streamId,
            parent: insertionObject.id,
            child: prop,
            minDepth: obj.__closure[prop]
          })
          totalChildrenCountGlobal++
          if (totalChildrenCountByDepth[obj.__closure[prop].toString()])
            totalChildrenCountByDepth[obj.__closure[prop].toString()]++
          else totalChildrenCountByDepth[obj.__closure[prop].toString()] = 1
        }
      }

      insertionObject.totalChildrenCount = totalChildrenCountGlobal
      insertionObject.totalChildrenCountByDepth = JSON.stringify(
        totalChildrenCountByDepth
      )

      delete insertionObject.__tree
      delete insertionObject.__closure

      objsToInsert.push(insertionObject)
      ids.push(insertionObject.id)
    })

    const closureBatchSize = 1000
    const objectsBatchSize = 500

    // step 1: insert objects
    if (objsToInsert.length > 0) {
      const batches = chunk(objsToInsert, objectsBatchSize)
      for (const [index, batch] of batches.entries()) {
        this.prepInsertionObjectBatch(batch)
        await this.tables.objects.insert(batch).onConflict().ignore()
        this.logger.info(
          {
            currentBatchCount: batch.length,
            currentBatchId: index + 1,
            totalNumberOfBatches: batches.length
          },
          'Inserted {currentBatchCount} objects from batch {currentBatchId} of {totalNumberOfBatches}'
        )
      }
    }

    // step 2: insert closures
    if (closures.length > 0) {
      const batches = chunk(closures, closureBatchSize)

      for (const [index, batch] of batches.entries()) {
        this.prepInsertionClosureBatch(batch)
        await this.tables.closures.insert(batch).onConflict().ignore()
        this.logger.info(
          {
            currentBatchCount: batch.length,
            currentBatchId: index + 1,
            totalNumberOfBatches: batches.length
          },
          'Inserted {currentBatchCount} closures from batch {currentBatchId} of {totalNumberOfBatches}'
        )
      }
    }
    return ids
  }

  prepInsertionObject(streamId, obj) {
    const maximumObjectSizeMB = parseInt(process.env['MAX_OBJECT_SIZE_MB'] || '10')
    const MAX_OBJECT_SIZE = maximumObjectSizeMB * 1024 * 1024

    if (obj.hash) obj.id = obj.hash
    else
      obj.id =
        obj.id || crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex') // generate a hash if none is present

    const stringifiedObj = JSON.stringify(obj)
    if (stringifiedObj.length > MAX_OBJECT_SIZE) {
      throw new Error(
        `Object too large (${stringifiedObj.length} > ${MAX_OBJECT_SIZE})`
      )
    }

    return {
      data: stringifiedObj, // stored in jsonb column
      streamId,
      id: obj.id,
      speckleType: obj.speckleType
    }
  }

  prepInsertionObjectBatch(batch) {
    batch.sort((a, b) => (a.id > b.id ? 1 : -1))
  }

  prepInsertionClosureBatch(batch) {
    batch.sort((a, b) =>
      a.parent > b.parent
        ? 1
        : a.parent === b.parent
        ? a.child > b.child
          ? 1
          : -1
        : -1
    )
  }

  async getBranchByNameAndStreamId({ streamId, name }) {
    const query = this.tables.branches
      .select('*')
      .where({ streamId })
      .andWhere(this.db.raw('LOWER(name) = ?', [name]))
      .first()
    return await query
  }

  async createBranch({ name, description, streamId, authorId }) {
    const branch = {}
    branch.id = crs({ length: 10 })
    branch.streamId = streamId
    branch.authorId = authorId
    branch.name = name.toLowerCase()
    branch.description = description

    await this.tables.branches.returning('id').insert(branch)

    // update stream updated at
    await this.tables.streams
      .where({ id: streamId })
      .update({ updatedAt: this.db.fn.now() })

    return branch.id
  }

  async createBareToken() {
    const tokenId = crs({ length: 10 })
    const tokenString = crs({ length: 32 })
    const tokenHash = await bcrypt.hash(tokenString, 10)
    const lastChars = tokenString.slice(tokenString.length - 6, tokenString.length)

    return { tokenId, tokenString, tokenHash, lastChars }
  }

  async createToken({ userId, name, scopes, lifespan }) {
    const { tokenId, tokenString, tokenHash, lastChars } = await this.createBareToken()

    if (scopes.length === 0) throw new Error('No scopes provided')

    const token = {
      id: tokenId,
      tokenDigest: tokenHash,
      lastChars,
      owner: userId,
      name,
      lifespan
    }
    const tokenScopes = scopes.map((scope) => ({ tokenId, scopeName: scope }))

    await this.tables.apiTokens.insert(token)
    await this.tables.tokenScopes.insert(tokenScopes)

    return { id: tokenId, token: tokenId + tokenString }
  }

  async revokeTokenById(tokenId) {
    const delCount = await this.tables.apiTokens
      .where({ id: tokenId.slice(0, 10) })
      .del()

    if (delCount === 0) throw new Error('Token revokation failed')
    return true
  }
}
