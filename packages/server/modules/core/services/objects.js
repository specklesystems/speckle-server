const { set, get } = require('lodash')

const knex = require(`@/db/knex`)

const Objects = () => knex('objects')

module.exports = {
  async getObjectChildrenStream({ streamId, objectId }) {
    const q = knex.with(
      'object_children_closure',
      knex.raw(
        `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
        [streamId, objectId]
      )
    )
    q.select('id')
    q.select(knex.raw('data::text as "dataText"'))
    q.from('object_children_closure')

    q.rightJoin('objects', function () {
      this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
        'objects.id',
        '=',
        'object_children_closure.child'
      )
    })
      .where(
        knex.raw('object_children_closure."streamId" = ? AND parent = ?', [
          streamId,
          objectId
        ])
      )
      .orderBy('objects.id')
    return q.stream({ highWaterMark: 500 })
  },

  /**
   * @returns {Promise<{objects: import('@/modules/core/helpers/types').ObjectRecord[], cursor: string | null}>}
   */
  async getObjectChildren({ streamId, objectId, limit, depth, select, cursor }) {
    limit = parseInt(limit) || 50
    depth = parseInt(depth) || 1000

    let fullObjectSelect = false

    const q = knex.with(
      'object_children_closure',
      knex.raw(
        `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
        [streamId, objectId]
      )
    )

    if (Array.isArray(select)) {
      select.forEach((field, index) => {
        q.select(
          knex.raw('jsonb_path_query(data, :path) as :name:', {
            path: '$.' + field,
            name: '' + index
          })
        )
      })
    } else {
      fullObjectSelect = true
      q.select('data')
    }

    q.select('id')
    q.select('createdAt')
    q.select('speckleType')
    q.select('totalChildrenCount')

    q.from('object_children_closure')

    q.rightJoin('objects', function () {
      this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
        'objects.id',
        '=',
        'object_children_closure.child'
      )
    })
      .where(
        knex.raw('object_children_closure."streamId" = ? AND parent = ?', [
          streamId,
          objectId
        ])
      )
      .andWhere(knex.raw('object_children_closure.mindepth < ?', [depth]))
      .andWhere(knex.raw('id > ?', [cursor ? cursor : '0']))
      .orderBy('objects.id')
      .limit(limit)

    const rows = await q

    if (rows.length === 0) {
      return { objects: rows, cursor: null }
    }

    if (!fullObjectSelect)
      rows.forEach((o, i, arr) => {
        const no = {
          id: o.id,
          createdAt: o.createdAt,
          speckleType: o.speckleType,
          totalChildrenCount: o.totalChildrenCount,
          data: {}
        }
        let k = 0
        for (const field of select) {
          set(no.data, field, o[k++])
        }
        arr[i] = no
      })

    const lastId = rows[rows.length - 1].id
    return { objects: rows, cursor: lastId }
  },

  /**
   *
   * This query is inefficient on larger sets (n * 10k objects) as we need to return the total count on an arbitrarily (user) defined selection of objects.
   * A possible future optimisation route would be to cache the total count of a query (as objects are immutable, it will not change) on a first run, and, if found on a subsequent round, do a simpler query and merge the total count result.
   * @param {*} param0
   * @returns {Promise<{objects: import('@/modules/core/helpers/types').ObjectRecord[], cursor: string | null, totalCount: number}>}
   */
  async getObjectChildrenQuery({
    streamId,
    objectId,
    limit,
    depth,
    select,
    cursor,
    query,
    orderBy
  }) {
    limit = parseInt(limit) || 50
    depth = parseInt(depth) || 1000
    orderBy = orderBy || { field: 'id', direction: 'asc' }

    // Cursors received by this service should be base64 encoded. They are generated on first entry query by this service; They should never be client-side generated.
    if (cursor) {
      cursor = JSON.parse(Buffer.from(cursor, 'base64').toString('binary'))
    }

    // Flag that keeps track of whether we select the whole "data" part of an object or not
    let fullObjectSelect = false
    if (Array.isArray(select)) {
      // if we order by a field that we do not select, select it!
      if (orderBy && select.indexOf(orderBy.field) === -1) {
        select.push(orderBy.field)
      }
      // // always add the id!
      // if ( select.indexOf( 'id' ) === -1 ) select.unshift( 'id' )
    } else {
      fullObjectSelect = true
    }

    const additionalIdOrderBy = orderBy.field !== 'id'

    const operatorsWhitelist = ['=', '>', '>=', '<', '<=', '!=']

    const mainQuery = knex
      .with(
        'object_children_closure',
        knex.raw(
          `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
          [streamId, objectId]
        )
      )
      .with('objs', (cteInnerQuery) => {
        // always select the id
        cteInnerQuery.select('id').from('object_children_closure')
        cteInnerQuery.select('createdAt')
        cteInnerQuery.select('speckleType')
        cteInnerQuery.select('totalChildrenCount')

        // if there are any select fields, add them
        if (Array.isArray(select)) {
          select.forEach((field, index) => {
            cteInnerQuery.select(
              knex.raw('jsonb_path_query(data, :path) as :name:', {
                path: '$.' + field,
                name: '' + index
              })
            )
          })
          // otherwise, get the whole object, as stored in the jsonb column
        } else {
          cteInnerQuery.select('data')
        }

        // join on objects table
        cteInnerQuery
          .join('objects', function () {
            this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
              'objects.id',
              '=',
              'object_children_closure.child'
            )
          })
          .where('object_children_closure.streamId', streamId)
          .andWhere('parent', objectId)
          .andWhere('mindepth', '<', depth)

        // Add user provided filters/queries.
        if (Array.isArray(query) && query.length > 0) {
          cteInnerQuery.andWhere((nestedWhereQuery) => {
            query.forEach((statement, index) => {
              let castType = 'text'
              if (typeof statement.value === 'string') castType = 'text'
              if (typeof statement.value === 'boolean') castType = 'boolean'
              if (typeof statement.value === 'number') castType = 'numeric'

              if (operatorsWhitelist.indexOf(statement.operator) === -1)
                throw new Error('Invalid operator for query')

              // Determine the correct where clause (where, and where, or where)
              let whereClause
              if (index === 0) whereClause = 'where'
              else if (statement.verb && statement.verb.toLowerCase() === 'or')
                whereClause = 'orWhere'
              else whereClause = 'andWhere'

              // Note: castType is generated from the statement's value and operators are matched against a whitelist.
              // If comparing with strings, the jsonb_path_query(_first) func returns json encoded strings (ie, `bar` is actually `"bar"`), hence we need to add the quotes manually to the raw provided comparison value.
              nestedWhereQuery[whereClause](
                knex.raw(
                  `jsonb_path_query_first( data, ? )::${castType} ${statement.operator} ? `,
                  [
                    '$.' + statement.field,
                    castType === 'text' ? `"${statement.value}"` : statement.value
                  ]
                )
              )
            })
          })
        }

        // Order by clause; validate direction!
        const direction =
          orderBy.direction && orderBy.direction.toLowerCase() === 'desc'
            ? 'desc'
            : 'asc'
        if (orderBy.field === 'id') {
          cteInnerQuery.orderBy('id', direction)
        } else {
          cteInnerQuery.orderByRaw(
            knex.raw(`jsonb_path_query_first( data, ? ) ${direction}, id asc`, [
              '$.' + orderBy.field
            ])
          )
        }
      })
      .select('*')
      .from('objs')
      .joinRaw('RIGHT JOIN ( SELECT count(*) FROM "objs" ) c(total_count) ON TRUE')

    // Set cursor clause, if present. If it's not present, it's an entry query; this method will return a cursor based on its given query.
    // We have implemented keyset pagination for more efficient searches on larger sets. This approach depends on an order by value provided by the user and a (hidden) primary key.
    // logger.debug( cursor )
    if (cursor) {
      let castType = 'text'
      if (typeof cursor.value === 'string') castType = 'text'
      if (typeof cursor.value === 'boolean') castType = 'boolean'
      if (typeof cursor.value === 'number') castType = 'numeric'

      // When strings are used inside an order clause, as mentioned above, we need to add quotes around the comparison value, as the jsonb_path_query funcs return json encoded strings (`{"test":"foo"}` => test is returned as `"foo"`)
      if (castType === 'text') cursor.value = `"${cursor.value}"`

      if (operatorsWhitelist.indexOf(cursor.operator) === -1)
        throw new Error('Invalid operator for cursor')

      // Unwrapping the tuple comparison of ( userOrderByField, id ) > ( lastValueOfUserOrderBy, lastSeenId )
      if (fullObjectSelect) {
        if (cursor.field === 'id') {
          mainQuery.where(knex.raw(`id ${cursor.operator} ? `, [cursor.value]))
        } else {
          mainQuery.where(
            knex.raw(
              `jsonb_path_query_first( data, ? )::${castType} ${cursor.operator}= ? `,
              ['$.' + cursor.field, cursor.value]
            )
          )
        }
      } else {
        mainQuery.where(
          knex.raw(`??::${castType} ${cursor.operator}= ? `, [
            select.indexOf(cursor.field).toString(),
            cursor.value
          ])
        )
      }

      if (cursor.lastSeenId) {
        mainQuery.andWhere((qb) => {
          qb.where('id', '>', cursor.lastSeenId)
          if (fullObjectSelect)
            qb.orWhere(
              knex.raw(
                `jsonb_path_query_first( data, ? )::${castType} ${cursor.operator} ? `,
                ['$.' + cursor.field, cursor.value]
              )
            )
          else
            qb.orWhere(
              knex.raw(`??::${castType} ${cursor.operator} ? `, [
                select.indexOf(cursor.field).toString(),
                cursor.value
              ])
            )
        })
      }
    }

    mainQuery.limit(limit)
    // logger.debug( mainQuery.toString() )
    // Finally, execute the query
    const rows = await mainQuery
    const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0

    // Return early
    if (totalCount === 0) return { totalCount, objects: [], cursor: null }

    // Reconstruct the object based on the provided select paths.
    if (!fullObjectSelect) {
      rows.forEach((o, i, arr) => {
        const no = {
          id: o.id,
          createdAt: o.createdAt,
          speckleType: o.speckleType,
          totalChildrenCount: o.totalChildrenCount,
          data: {}
        }
        let k = 0
        for (const field of select) {
          set(no.data, field, o[k++])
        }
        arr[i] = no
      })
    }

    // Assemble the cursor for an eventual next call
    cursor = cursor || {}
    const cursorObj = {
      field: cursor.field || orderBy.field,
      operator:
        cursor.operator ||
        (orderBy.direction && orderBy.direction.toLowerCase() === 'desc' ? '<' : '>'),
      value: get(rows[rows.length - 1], `data.${orderBy.field}`)
    }

    // If we're not ordering by id (default case, where no order by argument is provided), we need to add the last seen id of this query in order to enable keyset pagination.
    if (additionalIdOrderBy) {
      cursorObj.lastSeenId = rows[rows.length - 1].id
    }

    // Cursor objects should be client-side opaque, hence we encode them to base64.
    const cursorEncoded = Buffer.from(JSON.stringify(cursorObj), 'binary').toString(
      'base64'
    )
    return {
      totalCount,
      objects: rows,
      cursor: rows.length === limit ? cursorEncoded : null
    }
  },

  async getObjects(streamId, objectIds) {
    const res = await Objects()
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .select(
        'id',
        'speckleType',
        'totalChildrenCount',
        'totalChildrenCountByDepth',
        'createdAt',
        'data'
      )
    return res
  },

  async getObjectsStream({ streamId, objectIds }) {
    const res = Objects()
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .orderBy('id')
      .select(
        knex.raw(
          '"id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data::text as "dataText"'
        )
      )
    return res.stream({ highWaterMark: 500 })
  },

  async hasObjects({ streamId, objectIds }) {
    const dbRes = await Objects()
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .select('id')

    const res = {}
    for (const i in objectIds) {
      res[objectIds[i]] = false
    }
    for (const i in dbRes) {
      res[dbRes[i].id] = true
    }
    return res
  }
}
