'use strict'
const crs = require('crypto-random-string')
const knex = require('@/db/knex')

const Comments = () => knex('comments')
const CommentLinks = () => knex('comment_links')
const CommentViews = () => knex('comment_views')

module.exports = {
  async streamResourceCheck({ streamId, resources }) {
    // this itches - a for loop with queries... but okay let's hit the road now
    for (const res of resources) {
      // The switch of doom: if something throws, we're out
      switch (res.resourceType) {
        case 'stream':
          // Stream validity is already checked, so we can just go ahead.
          break
        case 'commit': {
          const linkage = await knex('stream_commits')
            .select()
            .where({ commitId: res.resourceId, streamId })
            .first()
          if (!linkage) throw new Error('Commit not found')
          if (linkage.streamId !== streamId)
            throw new Error(
              'Stop hacking - that commit id is not part of the specified stream.'
            )
          break
        }
        case 'object': {
          const obj = await knex('objects')
            .select()
            .where({ id: res.resourceId, streamId })
            .first()
          if (!obj) throw new Error('Object not found')
          break
        }
        case 'comment': {
          const comment = await Comments().where({ id: res.resourceId }).first()
          if (!comment) throw new Error('Comment not found')
          if (comment.streamId !== streamId)
            throw new Error(
              'Stop hacking - that comment is not part of the specified stream.'
            )
          break
        }
        default:
          throw Error(
            `resource type ${res.resourceType} is not supported as a comment target`
          )
      }
    }
  },

  async createComment({ userId, input }) {
    if (input.resources.length < 1)
      throw Error('Must specify at least one resource as the comment target')

    const commentResource = input.resources.find((r) => r.resourceType === 'comment')
    if (commentResource) throw new Error('Please use the comment reply mutation.')

    // Stream checks
    const streamResources = input.resources.filter((r) => r.resourceType === 'stream')
    if (streamResources.length > 1)
      throw Error('Commenting on multiple streams is not supported')

    const [stream] = streamResources
    if (stream && stream.resourceId !== input.streamId)
      throw Error("Input streamId doesn't match the stream resource.resourceId")

    const comment = { ...input }

    delete comment.resources

    comment.id = crs({ length: 10 })
    comment.authorId = userId

    await Comments().insert(comment)
    try {
      await module.exports.streamResourceCheck({
        streamId: input.streamId,
        resources: input.resources
      })
      for (const res of input.resources) {
        await CommentLinks().insert({
          commentId: comment.id,
          resourceId: res.resourceId,
          resourceType: res.resourceType
        })
      }
    } catch (e) {
      await Comments().where({ id: comment.id }).delete() // roll back
      throw e // pass on to resolver
    }
    await module.exports.viewComment({ userId, commentId: comment.id }) // so we don't self mark a comment as unread the moment it's created
    return comment.id
  },

  async createCommentReply({ authorId, parentCommentId, streamId, text, data }) {
    const comment = {
      id: crs({ length: 10 }),
      authorId,
      text,
      data,
      streamId,
      parentComment: parentCommentId
    }
    await Comments().insert(comment)
    try {
      const commentLink = { resourceId: parentCommentId, resourceType: 'comment' }
      await module.exports.streamResourceCheck({
        streamId,
        resources: [commentLink]
      })
      await CommentLinks().insert({ commentId: comment.id, ...commentLink })
    } catch (e) {
      await Comments().where({ id: comment.id }).delete() // roll back
      throw e // pass on to resolver
    }
    await Comments().where({ id: parentCommentId }).update({ updatedAt: knex.fn.now() })

    return comment.id
  },

  async editComment({ userId, input }) {
    const editedComment = await Comments().where({ id: input.id }).first()
    if (!editedComment) throw new Error("The comment doesn't exist")
    if (editedComment.authorId !== userId)
      throw new Error("You cannot edit someone else's comments")

    await Comments().where({ id: input.id }).update({ text: input.text })
  },

  async viewComment({ userId, commentId }) {
    const query = CommentViews()
      .insert({ commentId, userId, viewedAt: knex.fn.now() })
      .onConflict(knex.raw('("commentId","userId")'))
      .merge()
    await query
  },

  async getComment({ id, userId = null }) {
    const query = Comments().select('*').joinRaw(`
        join(
          select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
          from comment_links cl
          join comments on comments.id = cl."commentId"
          group by cl."commentId"
        ) res using(id)`)
    if (userId) {
      query.leftOuterJoin('comment_views', (b) => {
        b.on('comment_views.commentId', '=', 'comments.id')
        b.andOn('comment_views.userId', '=', knex.raw('?', userId))
      })
    }
    query.where({ id }).first()
    const res = await query
    return res
  },

  async archiveComment({ commentId, userId, streamId, archived = true }) {
    const comment = await Comments().where({ id: commentId }).first()
    if (!comment)
      throw new Error(
        `No comment ${commentId} exists, cannot change its archival status`
      )

    const aclEntry = await knex('stream_acl')
      .select()
      .where({ resourceId: streamId, userId })
      .first()

    if (comment.authorId !== userId) {
      if (!aclEntry || aclEntry.role !== 'stream:owner')
        throw new Error("You don't have permission to archive the comment")
    }

    await Comments().where({ id: commentId }).update({ archived })
    return true
  },

  async getComments({
    resources,
    limit,
    cursor,
    userId = null,
    replies = false,
    streamId,
    archived = false
  }) {
    const query = knex.with('comms', (cte) => {
      cte.select().distinctOn('id').from('comments')
      cte.join('comment_links', 'comments.id', '=', 'commentId')

      if (userId) {
        // link viewed At
        cte.leftOuterJoin('comment_views', (b) => {
          b.on('comment_views.commentId', '=', 'comments.id')
          b.andOn('comment_views.userId', '=', knex.raw('?', userId))
        })
      }

      if (resources && resources.length !== 0) {
        cte.where((q) => {
          // link resources
          for (const res of resources) {
            q.orWhere('comment_links.resourceId', '=', res.resourceId)
          }
        })
      } else {
        cte.where({ streamId })
      }
      if (!replies) {
        cte.whereNull('parentComment')
      }
      cte.where('archived', '=', archived)
    })

    query.select().from('comms')

    // total count coming from our cte
    query.joinRaw('right join (select count(*) from comms) c(total_count) on true')

    // get comment's all linked resources
    query.joinRaw(`
      join(
        select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
        from comment_links cl
        join comms on comms.id = cl."commentId"
        group by cl."commentId"
      ) res using(id)`)

    if (cursor) {
      query.where('createdAt', '<', cursor)
    }

    query.orderBy('createdAt', 'desc')
    query.limit(limit ?? 10)

    const rows = await query
    const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0
    const nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

    return {
      items: rows,
      cursor: nextCursor,
      totalCount
    }
  },

  async getResourceCommentCount({ resourceId }) {
    const [res] = await CommentLinks()
      .count('commentId')
      .where({ resourceId })
      .join('comments', 'comments.id', '=', 'commentId')
      .where('comments.archived', '=', false)

    if (res && res.count) {
      return parseInt(res.count)
    }
    return 0
  },

  async getStreamCommentCount({ streamId }) {
    const [res] = await Comments()
      .count('id')
      .where({ streamId })
      .andWhere({ archived: false })
      .whereNull('parentComment')
    if (res && res.count) {
      return parseInt(res.count)
    }
    return 0
  }
}
