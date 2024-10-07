import { Nullable, Optional } from '@speckle/shared'
import {
  ModelVersionsFilter,
  StreamCommitsArgs
} from '@/modules/core/graph/generated/graphql'
import {
  getBranchCommitsTotalCount,
  getPaginatedBranchCommits as getPaginatedBranchCommitsDb,
  getSpecificBranchCommitsFactory,
  getStreamCommitCountFactory,
  PaginatedBranchCommitsParams
} from '@/modules/core/repositories/commits'
import { getCommitsByStreamId } from '@/modules/core/services/commits'
import { BadRequestError } from '@/modules/shared/errors'
import { db } from '@/db/knex'

export async function getPaginatedStreamCommits(
  streamId: string,
  params: StreamCommitsArgs
) {
  if (params.limit && params.limit > 100)
    throw new BadRequestError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { commits: items, cursor } = await getCommitsByStreamId({
    streamId,
    limit: params.limit,
    cursor: params.cursor,
    ignoreGlobalsBranch: true
  })
  const totalCount = await getStreamCommitCountFactory({ db })(streamId, {
    ignoreGlobalsBranch: true
  })

  return { items, cursor, totalCount }
}

export async function getPaginatedBranchCommits(
  params: PaginatedBranchCommitsParams & { filter?: Nullable<ModelVersionsFilter> }
) {
  if (params.limit && params.limit > 100)
    throw new BadRequestError(
      'Cannot return more than 100 items, please use pagination.'
    )

  const getSpecificBranchCommits = getSpecificBranchCommitsFactory({ db })

  // Load priority commits first
  let priorityCommitPromise: Optional<ReturnType<typeof getSpecificBranchCommits>> =
    undefined
  const loadPriorityIds = params.filter?.priorityIds && !params.cursor
  if (params.filter?.priorityIds && loadPriorityIds) {
    priorityCommitPromise = getSpecificBranchCommits(
      params.filter.priorityIds.map((i) => ({
        branchId: params.branchId,
        commitId: i
      }))
    )
  }

  const priorityIdsOnly = loadPriorityIds && params.filter?.priorityIdsOnly
  const [results, totalCount, priorityCommits] = await Promise.all([
    !priorityIdsOnly
      ? getPaginatedBranchCommitsDb({
          ...params,
          filter: {
            ...(params.filter || {}),
            // If we loaded priority commits first, exclude them from base results
            excludeIds: params.filter?.priorityIds || undefined
          }
        })
      : { commits: [], cursor: null },
    !priorityIdsOnly
      ? getBranchCommitsTotalCount(params)
      : (priorityCommitPromise || Promise.resolve([])).then(
          (commits) => commits.length
        ),
    priorityCommitPromise || Promise.resolve([])
  ])

  const newItems = [...priorityCommits, ...results.commits].slice(0, params.limit)
  const newCursor =
    newItems.length > 0 ? newItems[newItems.length - 1].createdAt.toISOString() : null

  return {
    totalCount,
    cursor: newCursor,
    items: newItems
  }
}
