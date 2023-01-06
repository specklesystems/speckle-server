import { BranchCommits, Branches, Commits, knex } from '@/modules/core/dbSchema'
import { ProjectModelsArgs } from '@/modules/core/graph/generated/graphql'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import crs from 'crypto-random-string'
import { Knex } from 'knex'
import { clamp, trim } from 'lodash'

export const generateBranchId = () => crs({ length: 10 })

export async function getBranchesByIds(branchIds: string[]) {
  if (!branchIds?.length) return []

  const q = Branches.knex<BranchRecord[]>().whereIn(Branches.col.id, branchIds)
  return await q
}

export async function getStreamBranchesByName(
  streamId: string,
  names: string[]
): Promise<BranchRecord[]> {
  if (!streamId || !names?.length) return []

  const q = Branches.knex<BranchRecord[]>()
    .where(Branches.col.streamId, streamId)
    .andWhere(
      knex.raw('LOWER(??) = ANY(?)', [
        Branches.col.name,
        names.map((n) => n.toLowerCase())
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

export async function getBranchLatestCommits(branchIds: string[]) {
  if (!branchIds?.length) return []

  const q = Branches.knex()
    .select<Array<CommitRecord & { branchId: string }>>([
      ...Commits.cols,
      knex.raw(`?? as "branchId"`, [Branches.col.id])
    ])
    .distinctOn(Branches.col.id)
    .whereIn(Branches.col.id, branchIds)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
    .orderBy([
      { column: Branches.col.id },
      { column: Commits.col.createdAt, order: 'desc' }
    ])

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
    .groupBy(Branches.col.id)

  if (filter?.contributors?.length || filter?.sourceApps?.length) {
    q.innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    q.innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)

    if (filter.contributors?.length) {
      q.whereIn(Commits.col.author, filter.contributors)
    }

    if (filter.sourceApps?.length) {
      q.whereRaw(
        knex.raw(`?? ~* ?`, [
          Commits.col.sourceApplication,
          filter.sourceApps.join('|')
        ])
      )
    }
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
    const nameParts = record.name.split('/').filter((n) => n !== '')
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

  const q = getPaginatedProjectModelsBaseQuery<BranchRecord[]>(projectId, params)
  q.limit(clamp(limit || 25, 1, 100)).orderBy(Branches.col.updatedAt, 'desc')

  if (cursor) q.andWhere(Branches.col.updatedAt, '>', cursor)

  const results = await q
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
  const q = getPaginatedProjectModelsBaseQuery<{ count: string }[]>(projectId, params)
  q.clearSelect()
  q.count()

  const [res] = await q
  return parseInt(res?.count || '0')
}

export async function getModelTreeItems(
  projectId: string,
  parentModelName?: string,
  options?: Partial<{ filterOutEmptyMain: boolean }>
) {
  const { filterOutEmptyMain = true } = options || {}
  const cleanModelName = trim(trim(parentModelName || ''), '/').toLowerCase()
  const branchPartPattern = `[a-zA-Z\\d\\s]+` // regexp for each branch part between slashes

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

  const res = await finalQuery
  const items = res.map((i): ModelsTreeItemGraphQLReturn => {
    const fullName = cleanModelName ? `${cleanModelName}/${i.branchPart}` : i.branchPart

    return {
      projectId,
      name: i.branchPart,
      fullName,
      updatedAt: i.updatedAt,
      hasChildren: fullName.length < i.longestFullName.length
    }
  })

  return items
}
