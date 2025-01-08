import { Optional } from '@speckle/shared'
import { BranchCommits, Branches, Commits, knex } from '@/modules/core/dbSchema'
import { BranchNameError } from '@/modules/core/errors/branch'
import {
  ProjectModelsArgs,
  ProjectModelsTreeArgs
} from '@/modules/core/graph/generated/graphql'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import {
  BranchCommitRecord,
  BranchRecord,
  CommitRecord
} from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import crs from 'crypto-random-string'
import { Knex } from 'knex'
import { clamp, isUndefined, last, trim } from 'lodash'
import { getMaximumProjectModelsPerPage } from '@/modules/shared/helpers/envHelper'
import {
  DeleteBranchById,
  GenerateBranchId,
  GetBatchedStreamBranches,
  GetBranchById,
  GetBranchCommitCount,
  GetBranchCommitCounts,
  GetBranchesByIds,
  GetBranchLatestCommits,
  GetLatestStreamBranch,
  GetModelTreeItems,
  GetModelTreeItemsFiltered,
  GetModelTreeItemsFilteredTotalCount,
  GetModelTreeItemsTotalCount,
  GetPaginatedProjectModelsItems,
  GetPaginatedProjectModelsTotalCount,
  GetPaginatedStreamBranchesPage,
  GetStreamBranchByName,
  GetStreamBranchCount,
  GetStreamBranchCounts,
  GetStreamBranchesByName,
  GetStructuredProjectModels,
  InsertBranches,
  MarkCommitBranchUpdated,
  StoreBranch,
  UpdateBranch
} from '@/modules/core/domain/branches/operations'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'
import { ModelTreeItem } from '@/modules/core/domain/branches/types'

const tables = {
  branches: (db: Knex) => db<BranchRecord>(Branches.name),
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  branchCommits: (db: Knex) => db<BranchCommitRecord>(BranchCommits.name)
}

export const generateBranchId: GenerateBranchId = () => crs({ length: 10 })

export const getBranchesByIdsFactory =
  (deps: { db: Knex }): GetBranchesByIds =>
  async (branchIds: string[], options?: Partial<{ streamId: string }>) => {
    if (!branchIds?.length) return []
    const { streamId } = options || {}

    const q = tables.branches(deps.db).whereIn(Branches.col.id, branchIds)
    if (streamId) {
      q.andWhere(Branches.col.streamId, streamId)
    }

    return await q
  }

export const getBranchByIdFactory =
  (deps: { db: Knex }): GetBranchById =>
  async (branchId: string, options?: Partial<{ streamId: string }>) => {
    const [branch] = await getBranchesByIdsFactory(deps)([branchId], options)
    return branch as Optional<BranchRecord>
  }

export const getStreamBranchesByNameFactory =
  (deps: { db: Knex }): GetStreamBranchesByName =>
  async (
    streamId: string,
    names: string[],
    options?: Partial<{
      /**
       * Set to true if you want to find branches that start with specified names as prefixes
       */
      startsWithName: boolean
    }>
  ): Promise<BranchRecord[]> => {
    if (!streamId || !names?.length) return []
    const { startsWithName } = options || {}

    const q = tables
      .branches(deps.db)
      .where(Branches.col.streamId, streamId)
      .andWhere((w1) => {
        w1.where(
          knex.raw('LOWER(??) ilike ANY(?)', [
            Branches.col.name,
            names.map((n) => n.toLowerCase() + (startsWithName ? '%' : ''))
          ])
        )

        if (!options?.startsWithName) {
          // There are some edge cases with branches that have backwards slashes in their name that break the query,
          // hence the extra condition
          w1.orWhereIn(Branches.col.name, names)
        }
      })

    return await q
  }

export const getStreamBranchByNameFactory =
  (deps: { db: Knex }): GetStreamBranchByName =>
  async (streamId: string, name: string) => {
    if (!streamId || !name) return null

    const [first] = await getStreamBranchesByNameFactory(deps)(streamId, [name])
    return first || null
  }

export const getBatchedStreamBranchesFactory =
  (deps: { db: Knex }): GetBatchedStreamBranches =>
  (streamId: string, options?: Partial<BatchedSelectOptions>) => {
    const baseQuery = tables
      .branches(deps.db)
      .select<BranchRecord[]>('*')
      .where(Branches.col.streamId, streamId)
      .orderBy(Branches.col.id)

    return executeBatchedSelect(baseQuery, options)
  }

export const insertBranchesFactory =
  (deps: { db: Knex }): InsertBranches =>
  async (branches: BranchRecord[], options?: Partial<{ trx: Knex.Transaction }>) => {
    const q = tables.branches(deps.db).insert(branches)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

export const getStreamBranchCountsFactory =
  (deps: { db: Knex }): GetStreamBranchCounts =>
  async (
    streamIds: string[],
    options?: Partial<{
      /**
       * In FE2 we skip main branches in our queries, if they don't have any commits
       */
      skipEmptyMain: boolean
    }>
  ) => {
    const { skipEmptyMain } = options || {}
    if (!streamIds?.length) return []

    const q = tables
      .branches(deps.db)
      .select(Branches.col.streamId)
      .whereIn(Branches.col.streamId, streamIds)
      .count()
      .groupBy(Branches.col.streamId)

    if (skipEmptyMain) {
      q.andWhere((w) => {
        w.whereNot(Branches.col.name, 'main').orWhere(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          0 as any,
          '<',
          tables
            .branchCommits(deps.db)
            .count()
            .where(BranchCommits.col.branchId, knex.raw(Branches.col.id))
        )
      })
    }

    const results = (await q) as { streamId: string; count: string }[]
    return results.map((r) => ({ ...r, count: parseInt(r.count) }))
  }

export const getStreamBranchCountFactory =
  (deps: { db: Knex }): GetStreamBranchCount =>
  async (
    streamId: string,
    options?: Partial<{
      /**
       * In FE2 we skip main branches in our queries, if they don't have any commits
       */
      skipEmptyMain: boolean
    }>
  ) => {
    const [res] = await getStreamBranchCountsFactory(deps)([streamId], options)
    return res?.count || 0
  }

export const getPaginatedStreamBranchesPageFactory =
  (deps: { db: Knex }): GetPaginatedStreamBranchesPage =>
  async ({ streamId, limit, cursor }) => {
    limit = limit || 25
    const query = tables.branches(deps.db).select('*').where({ streamId })

    if (cursor) query.andWhere('createdAt', '>', cursor)
    query.orderBy('createdAt').limit(limit)

    const rows = await query
    return {
      items: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null
    }
  }

export const getBranchCommitCountsFactory =
  (deps: { db: Knex }): GetBranchCommitCounts =>
  async (branchIds: string[]) => {
    if (!branchIds?.length) return []

    const q = tables
      .branches(deps.db)
      .select(Branches.col.id)
      .whereIn(Branches.col.id, branchIds)
      .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
      .count()
      .groupBy(Branches.col.id)

    const results = (await q) as { id: string; count: string }[]
    return results.map((r) => ({ ...r, count: parseInt(r.count) }))
  }

export const getBranchCommitCountFactory =
  (deps: { db: Knex }): GetBranchCommitCount =>
  async (branchId: string) => {
    const [res] = await getBranchCommitCountsFactory(deps)([branchId])
    return res?.count || 0
  }

export const getBranchLatestCommitsFactory =
  (deps: { db: Knex }): GetBranchLatestCommits =>
  async (
    branchIds?: string[],
    streamId?: string,
    options?: Partial<{
      limit: number
    }>
  ) => {
    if (!branchIds?.length && !streamId) return []
    const { limit } = options || {}

    const q = tables
      .branches(deps.db)
      .select<Array<BranchLatestCommit>>([
        ...Commits.cols,
        knex.raw(`?? as "branchId"`, [Branches.col.id])
      ])
      .distinctOn(Branches.col.id)
      .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
      .orderBy([
        { column: Branches.col.id },
        { column: Commits.col.createdAt, order: 'desc' }
      ])

    if (branchIds?.length) {
      q.whereIn(Branches.col.id, branchIds)
    }

    if (streamId?.length) {
      q.where(Branches.col.streamId, streamId)
    }

    if (!isUndefined(limit)) {
      q.limit(limit)
    }

    return await q
  }

const getPaginatedProjectModelsBaseQueryFactory =
  (deps: { db: Knex }) =>
  <T>(projectId: string, params: ProjectModelsArgs) => {
    const { filter } = params

    const q = tables
      .branches(deps.db)
      .select<T>(Branches.cols)
      .where(Branches.col.streamId, projectId)
      .leftJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .leftJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
      .groupBy(Branches.col.id)
      .havingRaw(knex.raw(`?? != 'globals'`, [Branches.col.name]))

    if (filter?.search) {
      q.whereILike(Branches.col.name, `%${filter.search}%`)
    }

    if (filter?.contributors?.length) {
      q.whereIn(Commits.col.author, filter.contributors)
    }

    if (filter?.sourceApps?.length) {
      q.whereRaw(
        knex.raw(`?? ~* ?`, [
          Commits.col.sourceApplication,
          filter.sourceApps.join('|')
        ])
      )
    }

    if (filter?.onlyWithVersions) {
      q.havingRaw(knex.raw(`COUNT(??) > 0`, [Commits.col.id]))
    } else {
      q.havingRaw(
        knex.raw(`(?? != 'main' OR COUNT(??) > 0)`, [Branches.col.name, Commits.col.id])
      )
    }

    if (filter?.ids?.length) {
      q.whereIn(Branches.col.id, filter.ids)
    }
    if (filter?.excludeIds?.length) {
      q.whereNotIn(Branches.col.id, filter.excludeIds)
    }

    return q
  }

export const getStructuredProjectModelsFactory =
  (deps: { db: Knex }): GetStructuredProjectModels =>
  async (projectId: string) => {
    const q = getPaginatedProjectModelsBaseQueryFactory(deps)<BranchRecord[]>(
      projectId,
      {}
    )
    const results = await q

    type TreeItem = ModelTreeItem

    const tree: TreeItem = { name: 'root', children: [], updatedAt: new Date(+0) }

    for (const record of results) {
      let currentLevel = tree
      const nameParts = record.name.split('/').filter((n: string) => n !== '')
      for (const part of nameParts) {
        const existing = currentLevel.children.find((c) => c.name === part)
        if (existing) {
          currentLevel = existing
        } else {
          const newTreeItem = {
            name: part,
            children: [] as TreeItem[],
            updatedAt: new Date(+0)
          }
          currentLevel.children.push(newTreeItem)
          currentLevel = newTreeItem
        }
      }
      currentLevel.model = record
      if (currentLevel.updatedAt < record.updatedAt)
        currentLevel.updatedAt = record.updatedAt
    }
    return tree
  }

export const getPaginatedProjectModelsItemsFactory =
  (deps: { db: Knex }): GetPaginatedProjectModelsItems =>
  async (projectId: string, params: ProjectModelsArgs) => {
    const { cursor, limit } = params
    if ((params.filter?.ids && !params.filter.ids.length) || limit === 0) {
      // empty ids: return empty array!
      return { items: [], cursor: null }
    }

    const maxProjectModelsPerPage = getMaximumProjectModelsPerPage()

    const q = getPaginatedProjectModelsBaseQueryFactory(deps)<BranchRecord[]>(
      projectId,
      params
    )
    q.limit(clamp(limit || 25, 1, maxProjectModelsPerPage)).orderBy(
      Branches.col.updatedAt,
      'desc'
    )

    if (cursor) q.andWhere(Branches.col.updatedAt, '<', cursor)

    const results = (await q) as BranchRecord[]
    return {
      items: results,
      cursor:
        results.length > 0 ? results[results.length - 1].updatedAt.toISOString() : null
    }
  }

export const getPaginatedProjectModelsTotalCountFactory =
  (deps: { db: Knex }): GetPaginatedProjectModelsTotalCount =>
  async (projectId: string, params: ProjectModelsArgs) => {
    if (params.filter?.ids && !params.filter.ids.length) {
      // empty ids: return count 0
      return 0
    }

    const baseQ = getPaginatedProjectModelsBaseQueryFactory(deps)(projectId, params)
    const q = deps.db.count<{ count: string }[]>().from(baseQ.as('sq1'))

    const [res] = await q
    return parseInt(res?.count || '0')
  }

const getModelTreeItemsFilteredBaseQueryFactory =
  (deps: { db: Knex }) =>
  (
    projectId: string,
    args: ProjectModelsTreeArgs,
    options?: Partial<{ filterOutEmptyMain: boolean }>
  ) => {
    const search = args.filter?.search || ''
    const sourceApps = args.filter?.sourceApps || []
    const contributors = args.filter?.contributors || []
    const isFiltering = search.length || sourceApps.length || contributors.length
    const filterOutEmptyMain = !isFiltering && (options?.filterOutEmptyMain ?? true)

    const BranchesJoin = Branches.with({ withCustomTablePrefix: 'b2' })

    const q = tables
      .branches(deps.db)
      .select<Array<{ name: string; updatedAt: Date; hasChildren: boolean }>>([
        Branches.col.name,
        Branches.col.updatedAt,
        knex.raw(`COUNT(??) > 0 as "hasChildren"`, [BranchesJoin.col.id])
      ])
      .leftJoin(BranchesJoin.name, (lj) => {
        lj.on(
          BranchesJoin.col.name,
          'ilike',
          knex.raw(`(?? || '/%')`, [Branches.col.name])
        )
          .andOn(BranchesJoin.col.name, '!=', Branches.col.name)
          .andOn(BranchesJoin.col.streamId, '=', Branches.col.streamId)
      })
      .where(Branches.col.streamId, projectId)
      .groupBy(Branches.col.id)
      .orderBy(Branches.col.updatedAt, 'desc')

    if (filterOutEmptyMain) {
      q.andWhere((w) => {
        w.whereNot(Branches.col.name, 'main').orWhere(
          0,
          '<',
          BranchCommits.knex()
            .count()
            .where(BranchCommits.col.branchId, knex.raw(Branches.col.id))
        )
      })
    }

    if (search.length) {
      q.andWhereILike(Branches.col.name, `%${search}%`)
    }

    if (sourceApps.length || contributors.length) {
      q.leftJoin(
        BranchCommits.name,
        BranchCommits.col.branchId,
        Branches.col.id
      ).leftJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)

      if (contributors.length) {
        q.whereIn(Commits.col.author, contributors)
      }

      if (sourceApps.length) {
        q.whereRaw(
          knex.raw(`?? ~* ?`, [Commits.col.sourceApplication, sourceApps.join('|')])
        )
      }
    }

    return q
  }

export const getModelTreeItemsFilteredFactory =
  (deps: { db: Knex }): GetModelTreeItemsFiltered =>
  async (
    projectId: string,
    args: ProjectModelsTreeArgs,
    options?: Partial<{ filterOutEmptyMain: boolean }>
  ) => {
    const limit = clamp(args.limit || 25, 0, 100)
    const q = getModelTreeItemsFilteredBaseQueryFactory(deps)(projectId, args, options)
    q.limit(limit)

    if (args.cursor) {
      q.andWhere(Branches.col.updatedAt, '<', args.cursor)
    }

    const res = await q
    const items = res.map((i): ModelsTreeItemGraphQLReturn => {
      const displayName = last(i.name.split('/')) as string
      return {
        id: `${projectId}-${i.name}`,
        projectId,
        name: displayName,
        fullName: i.name,
        updatedAt: i.updatedAt,
        hasChildren: i.hasChildren
      }
    })

    return items
  }

export const getModelTreeItemsFilteredTotalCountFactory =
  (deps: { db: Knex }): GetModelTreeItemsFilteredTotalCount =>
  async (
    projectId: string,
    args: ProjectModelsTreeArgs,
    options?: Partial<{ filterOutEmptyMain: boolean }>
  ) => {
    const baseQ = getModelTreeItemsFilteredBaseQueryFactory(deps)(
      projectId,
      args,
      options
    )
    const q = deps.db().count<{ count: string }[]>().from(baseQ.as('sq1'))
    const [row] = await q
    return parseInt(row.count || '0')
  }

const getModelTreeItemsBaseQueryFactory =
  (deps: { db: Knex }) =>
  (
    projectId: string,
    options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
  ) => {
    const cleanInput = (
      input: string | null | undefined,
      options?: Partial<{ escapeRegexp: boolean }>
    ) => {
      let clean = (input || '').toLowerCase()
      clean = trim(trim(clean), '/')
      clean = options?.escapeRegexp
        ? clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        : clean
      return clean
    }

    const { filterOutEmptyMain = true, parentModelName } = options || {}
    const cleanModelName = cleanInput(parentModelName, { escapeRegexp: true })
    const branchPartPattern = `[^/]+` // regexp for each branch part between slashes

    const regExp = cleanModelName.length
      ? // only direct children of parentModelName
        `^${cleanModelName}\\/(${branchPartPattern})`
      : // only first branch part (top level item)
        `^${branchPartPattern}`

    const branchPartMatcher = `(regexp_match("branches"."name", '${regExp}', 'i'))[1]`

    const baseQuery = tables
      .branches(deps.db)
      .select<{ updatedAt: Date; branchPart: string; longestFullName: string }[]>([
        // for sorting by updatedAt (of any of the children)
        knex.raw('MAX(??) as "updatedAt"', [Branches.col.updatedAt]),
        // for allowing filtering by parent branch name
        knex.raw(`${branchPartMatcher} as "branchPart"`),
        // for checking for children + checking if returned row represents 'main' if filterOutEmptyMain
        knex.raw(`MAX(??) as "longestFullName"`, [Branches.col.name])
      ])
      .where(Branches.col.streamId, projectId)
      .andWhere(knex.raw(`${branchPartMatcher} IS NOT NULL`))
      .groupBy('branchPart')
      .orderBy('updatedAt', 'desc')

    let finalQuery = baseQuery
    if (filterOutEmptyMain) {
      // Select branch id to check for attached commits
      // And count to ensure that there's only "main" and no children
      baseQuery.select([
        knex.raw(`(ARRAY_AGG(??))[1] as "lastId"`, [Branches.col.id]),
        knex.raw(`COUNT(??) as "branchCount"`, [Branches.col.id])
      ])

      // Wrap base query and filter out empty main
      finalQuery = (deps.db().from(baseQuery.as('sq1')) as typeof baseQuery)
        .select<{ updatedAt: Date; branchPart: string; longestFullName: string }[]>('*')
        .where((w1) => {
          // Either there are children branches, or the branch name isn't 'main'
          // Or the branch has more than 0 commits
          w1.where((w2) => {
            w2.whereNot('branchCount', 1)
              .orWhereNot('branchPart', knex.raw('"longestFullName"'))
              .orWhereNot('longestFullName', 'main')
          }).orWhere(
            knex.raw(
              `(SELECT COUNT(*) FROM "branch_commits" WHERE "branch_commits"."branchId" = "lastId")`
            ),
            '>',
            0
          )
        })
    }

    return {
      query: finalQuery,
      parentModelName: cleanInput(parentModelName)
    }
  }

export const getModelTreeItemsFactory =
  (deps: { db: Knex }): GetModelTreeItems =>
  async (
    projectId: string,
    args: Omit<ProjectModelsTreeArgs, 'filter'>,
    options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
  ) => {
    const limit = clamp(args.limit || 25, 0, 100)
    const { query, parentModelName } = getModelTreeItemsBaseQueryFactory(deps)(
      projectId,
      options
    )

    const finalQuery = deps.db.from(query.as('sq1'))
    finalQuery.limit(limit)

    if (args.cursor) {
      finalQuery.andWhere('updatedAt', '<', args.cursor)
    }

    const res = await finalQuery
    const items = res.map((i): ModelsTreeItemGraphQLReturn => {
      const fullName = parentModelName
        ? `${parentModelName}/${i.branchPart}`
        : i.branchPart

      return {
        id: `${projectId}-${fullName}`,
        projectId,
        name: i.branchPart,
        fullName,
        updatedAt: i.updatedAt,
        hasChildren: fullName.length < i.longestFullName.length
      }
    })

    return items
  }

export const getModelTreeItemsTotalCountFactory =
  (deps: { db: Knex }): GetModelTreeItemsTotalCount =>
  async (
    projectId: string,
    options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
  ) => {
    const { query } = getModelTreeItemsBaseQueryFactory(deps)(projectId, options)
    const q = deps.db().count<{ count: string }[]>().from(query.as('sq1'))
    const [row] = await q
    return parseInt(row.count || '0')
  }

export const validateBranchName = (name: string) => {
  name = (name || '').trim()
  if (!name) {
    throw new BranchNameError('Branch name is required')
  }

  if (
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.startsWith('#') ||
    name.startsWith('$') ||
    name.indexOf('//') !== -1 ||
    name.indexOf(',') !== -1 ||
    name.indexOf('\\') !== -1
  )
    throw new BranchNameError(
      'Branch names cannot start with "#", "$", start or end with "/", have multiple slashes next to each other (e.g., "//") or contain commas or backwards slashes.',
      {
        info: {
          name
        }
      }
    )
}

export const createBranchFactory =
  (deps: { db: Knex }): StoreBranch =>
  async (params: {
    name: string
    description: string | null
    streamId: string
    authorId: string
  }) => {
    const { streamId, authorId, name, description } = params

    const branch: Omit<BranchRecord, 'createdAt' | 'updatedAt'> = {
      id: generateBranchId(),
      streamId,
      authorId,
      name: name.toLowerCase(),
      description
    }

    validateBranchName(branch.name)

    const results = await tables.branches(deps.db).insert(branch, '*')
    const newBranch = results[0] as BranchRecord

    return newBranch
  }

export const updateBranchFactory =
  (deps: { db: Knex }): UpdateBranch =>
  async (branchId: string, branch: Partial<BranchRecord>) => {
    if (branch.name) {
      validateBranchName(branch.name)
      branch.name = branch.name.toLowerCase()
    }

    const [newBranch] = (await tables
      .branches(deps.db)
      .where(Branches.col.id, branchId)
      .update(branch, '*')) as BranchRecord[]
    return newBranch
  }

export const deleteBranchByIdFactory =
  (deps: { db: Knex }): DeleteBranchById =>
  async (branchId: string) => {
    // this needs to happen before deleting the branch, otherwise the
    // branch_commits table doesn't have the needed rows
    await tables
      .commits(deps.db)
      .join('branch_commits', 'commits.id', 'branch_commits.commitId')
      .where('branch_commits.branchId', branchId)
      .del()
    return await tables.branches(deps.db).where(Branches.col.id, branchId).del()
  }

export const markCommitBranchUpdatedFactory =
  (deps: { db: Knex }): MarkCommitBranchUpdated =>
  async (commitId: string) => {
    const q = tables
      .branches(deps.db)
      .whereIn(Branches.col.id, (w) => {
        w.select(BranchCommits.col.branchId)
          .from(BranchCommits.name)
          .where(BranchCommits.col.commitId, commitId)
      })
      .update(Branches.withoutTablePrefix.col.updatedAt, new Date(), '*')
    const [branch] = (await q) as BranchRecord[]
    return branch
  }

export const getLatestStreamBranchFactory =
  (deps: { db: Knex }): GetLatestStreamBranch =>
  async (streamId: string) => {
    const q = tables
      .branches(deps.db)
      .where(Branches.col.streamId, streamId)
      .orderBy(Branches.col.updatedAt, 'desc')
      .limit(1)
    const [branch] = await q
    return branch
  }
