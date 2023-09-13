import { Optional } from '@speckle/shared'
import { BranchCommits, Branches, Commits, knex } from '@/modules/core/dbSchema'
import { BranchNameError } from '@/modules/core/errors/branch'
import {
  ProjectModelsArgs,
  ProjectModelsTreeArgs
} from '@/modules/core/graph/generated/graphql'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import crs from 'crypto-random-string'
import { Knex } from 'knex'
import { clamp, last, trim } from 'lodash'

export const generateBranchId = () => crs({ length: 10 })

export async function getBranchesByIds(
  branchIds: string[],
  options?: Partial<{ streamId: string }>
) {
  if (!branchIds?.length) return []
  const { streamId } = options || {}

  const q = Branches.knex<BranchRecord[]>().whereIn(Branches.col.id, branchIds)
  if (streamId) {
    q.andWhere(Branches.col.streamId, streamId)
  }

  return await q
}

export async function getBranchById(
  branchId: string,
  options?: Partial<{ streamId: string }>
) {
  const [branch] = await getBranchesByIds([branchId], options)
  return branch as Optional<BranchRecord>
}

export async function getStreamBranchesByName(
  streamId: string,
  names: string[],
  options?: Partial<{
    /**
     * Set to true if you want to find branches that start with specified names as prefixes
     */
    startsWithName: boolean
  }>
): Promise<BranchRecord[]> {
  if (!streamId || !names?.length) return []
  const { startsWithName } = options || {}

  const q = Branches.knex<BranchRecord[]>()
    .where(Branches.col.streamId, streamId)
    .andWhere(
      knex.raw('LOWER(??) ilike ANY(?)', [
        Branches.col.name,
        names.map((n) => n.toLowerCase() + (startsWithName ? '%' : ''))
      ])
    )

  return await q
}

export async function getStreamBranchByName(streamId: string, name: string) {
  if (!streamId || !name) return null

  const [first] = await getStreamBranchesByName(streamId, [name])
  return first || null
}

export function getBatchedStreamBranches(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Branches.knex<BranchRecord[]>()
    .where(Branches.col.streamId, streamId)
    .orderBy(Branches.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertBranches(
  branches: BranchRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Branches.knex().insert(branches)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function getStreamBranchCounts(streamIds: string[]) {
  if (!streamIds?.length) return []

  const q = Branches.knex()
    .select(Branches.col.streamId)
    .whereIn(Branches.col.streamId, streamIds)
    .count()
    .groupBy(Branches.col.streamId)

  const results = (await q) as { streamId: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getStreamBranchCount(streamId: string) {
  const [res] = await getStreamBranchCounts([streamId])
  return res?.count || 0
}

export async function getBranchCommitCounts(branchIds: string[]) {
  if (!branchIds?.length) return []

  const q = Branches.knex()
    .select(Branches.col.id)
    .whereIn(Branches.col.id, branchIds)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
    .count()
    .groupBy(Branches.col.id)

  const results = (await q) as { id: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getBranchCommitCount(branchId: string) {
  const [res] = await getBranchCommitCounts([branchId])
  return res?.count || 0
}

export async function getBranchLatestCommits(branchIds?: string[], streamId?: string) {
  if (!branchIds?.length && !streamId) return []

  const q = Branches.knex()
    .select<Array<CommitRecord & { branchId: string }>>([
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

  return await q
}

function getPaginatedProjectModelsBaseQuery<T>(
  projectId: string,
  params: ProjectModelsArgs
) {
  const { filter } = params

  const q = Branches.knex()
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
      knex.raw(`?? ~* ?`, [Commits.col.sourceApplication, filter.sourceApps.join('|')])
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

export async function getStructuredProjectModels(projectId: string) {
  const q = getPaginatedProjectModelsBaseQuery<BranchRecord[]>(projectId, {})
  const results = await q

  type TreeItem = {
    name: string
    updatedAt: Date // TODO: set to newest updated at from its children / model
    model?: BranchRecord
    children: TreeItem[]
  }

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

export async function getPaginatedProjectModelsItems(
  projectId: string,
  params: ProjectModelsArgs
) {
  const { cursor, limit } = params
  if ((params.filter?.ids && !params.filter.ids.length) || limit === 0) {
    // empty ids: return empty array!
    return { items: [], cursor: null }
  }

  const q = getPaginatedProjectModelsBaseQuery<BranchRecord[]>(projectId, params)
  q.limit(clamp(limit || 25, 1, 100)).orderBy(Branches.col.updatedAt, 'desc')

  if (cursor) q.andWhere(Branches.col.updatedAt, '<', cursor)

  const results = (await q) as BranchRecord[]
  return {
    items: results,
    cursor:
      results.length > 0 ? results[results.length - 1].updatedAt.toISOString() : null
  }
}

export async function getPaginatedProjectModelsTotalCount(
  projectId: string,
  params: ProjectModelsArgs
) {
  if (params.filter?.ids && !params.filter.ids.length) {
    // empty ids: return count 0
    return 0
  }

  const baseQ = getPaginatedProjectModelsBaseQuery(projectId, params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))

  const [res] = await q
  return parseInt(res?.count || '0')
}

function getModelTreeItemsFilteredBaseQuery(
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{ filterOutEmptyMain: boolean }>
) {
  const search = args.filter?.search || ''
  const sourceApps = args.filter?.sourceApps || []
  const contributors = args.filter?.contributors || []
  const isFiltering = search.length || sourceApps.length || contributors.length
  const filterOutEmptyMain = !isFiltering && (options?.filterOutEmptyMain ?? true)

  const BranchesJoin = Branches.with({ withCustomTablePrefix: 'b2' })

  const q = Branches.knex()
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

export async function getModelTreeItemsFiltered(
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{ filterOutEmptyMain: boolean }>
) {
  const limit = clamp(args.limit || 25, 0, 100)
  const q = getModelTreeItemsFilteredBaseQuery(projectId, args, options)
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

export async function getModelTreeItemsFilteredTotalCount(
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{ filterOutEmptyMain: boolean }>
) {
  const baseQ = getModelTreeItemsFilteredBaseQuery(projectId, args, options)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
  const [row] = await q
  return parseInt(row.count || '0')
}

function getModelTreeItemsBaseQuery(
  projectId: string,
  options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
) {
  const cleanInput = (input: string | null | undefined) => {
    const clean = (input || '').toLowerCase()
    const trimmed = trim(trim(clean), '/')
    return trimmed
  }

  const { filterOutEmptyMain = true, parentModelName } = options || {}
  const cleanModelName = cleanInput(parentModelName)
  const branchPartPattern = `[^/]+` // regexp for each branch part between slashes

  const regExp = cleanModelName.length
    ? // only direct children of parentModelName
      `^${cleanModelName.replace('/', '\\/')}\\/(${branchPartPattern})`
    : // only first branch part (top level item)
      `^${branchPartPattern}`

  const branchPartMatcher = `(regexp_match("branches"."name", '${regExp}', 'i'))[1]`

  const baseQuery = Branches.knex()
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
    finalQuery = knex
      .select<{ updatedAt: Date; branchPart: string; longestFullName: string }[]>('*')
      .from(baseQuery.as('sq1'))
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
    parentModelName: cleanModelName
  }
}

export async function getModelTreeItems(
  projectId: string,
  args: Omit<ProjectModelsTreeArgs, 'filter'>,
  options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
) {
  const limit = clamp(args.limit || 25, 0, 100)
  const { query, parentModelName } = getModelTreeItemsBaseQuery(projectId, options)

  const finalQuery = knex.from(query.as('sq1'))
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

export async function getModelTreeItemsTotalCount(
  projectId: string,
  options?: Partial<{ filterOutEmptyMain: boolean; parentModelName: string }>
) {
  const { query } = getModelTreeItemsBaseQuery(projectId, options)
  const q = knex.count<{ count: string }[]>().from(query.as('sq1'))
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
    name.indexOf(',') !== -1
  )
    throw new BranchNameError(
      'Branch names cannot start with "#", "$", start or end with "/", have multiple slashes next to each other (e.g., "//") or contain commas.',
      {
        info: {
          name
        }
      }
    )
}

export async function createBranch(params: {
  name: string
  description: string | null
  streamId: string
  authorId: string
}) {
  const { streamId, authorId, name, description } = params

  const branch: Omit<BranchRecord, 'createdAt' | 'updatedAt'> = {
    id: generateBranchId(),
    streamId,
    authorId,
    name: name.toLowerCase(),
    description
  }

  validateBranchName(branch.name)

  const results = await Branches.knex().insert(branch, '*')
  const newBranch = results[0] as BranchRecord

  return newBranch
}

export async function updateBranch(branchId: string, branch: Partial<BranchRecord>) {
  if (branch.name) {
    validateBranchName(branch.name)
  }

  const [newBranch] = (await Branches.knex()
    .where(Branches.col.id, branchId)
    .update(branch, '*')) as BranchRecord[]
  return newBranch
}

export async function deleteBranchById(branchId: string) {
  return await Branches.knex().where(Branches.col.id, branchId).del()
}

export async function markCommitBranchUpdated(commitId: string) {
  const q = Branches.knex()
    .whereIn(Branches.col.id, (w) => {
      w.select(BranchCommits.col.branchId)
        .from(BranchCommits.name)
        .where(BranchCommits.col.commitId, commitId)
    })
    .update(Branches.withoutTablePrefix.col.updatedAt, new Date(), '*')
  const [branch] = (await q) as BranchRecord[]
  return branch
}
