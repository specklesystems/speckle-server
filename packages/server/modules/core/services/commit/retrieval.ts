import type { Nullable, Optional } from '@speckle/shared'
import type {
  ModelVersionsFilter,
  StreamCommitsArgs
} from '@/modules/core/graph/generated/graphql'
import { BadRequestError } from '@/modules/shared/errors'
import type {
  GetBranchCommitsTotalCount,
  GetBranchCommitsTotalCountByName,
  GetPaginatedBranchCommits,
  GetPaginatedBranchCommitsItems,
  GetPaginatedBranchCommitsItemsByName,
  GetSpecificBranchCommits,
  GetStreamCommitCount,
  GetTotalVersionCount,
  LegacyGetPaginatedStreamCommits,
  LegacyGetPaginatedStreamCommitsPage,
  PaginatedBranchCommitsParams
} from '@/modules/core/domain/commits/operations'
import type { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import { BranchNotFoundError } from '@/modules/core/errors/branch'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { getTotalVersionCountFactory } from '@/modules/core/repositories/commits'
import { sum } from 'lodash-es'

export const legacyGetPaginatedStreamCommitsFactory =
  (deps: {
    legacyGetPaginatedStreamCommitsPage: LegacyGetPaginatedStreamCommitsPage
    getStreamCommitCount: GetStreamCommitCount
  }): LegacyGetPaginatedStreamCommits =>
  async (streamId: string, params: StreamCommitsArgs) => {
    if (params.limit && params.limit > 100)
      throw new BadRequestError(
        'Cannot return more than 100 items, please use pagination.'
      )

    const { commits: items, cursor } = await deps.legacyGetPaginatedStreamCommitsPage({
      streamId,
      limit: params.limit,
      cursor: params.cursor,
      ignoreGlobalsBranch: true
    })
    const totalCount = await deps.getStreamCommitCount(streamId, {
      ignoreGlobalsBranch: true
    })

    return { items, cursor, totalCount }
  }

export const getPaginatedBranchCommitsFactory =
  (deps: {
    getSpecificBranchCommits: GetSpecificBranchCommits
    getPaginatedBranchCommitsItems: GetPaginatedBranchCommitsItems
    getBranchCommitsTotalCount: GetBranchCommitsTotalCount
  }): GetPaginatedBranchCommits =>
  async (
    params: PaginatedBranchCommitsParams & { filter?: Nullable<ModelVersionsFilter> }
  ) => {
    if (params.limit && params.limit > 100)
      throw new BadRequestError(
        'Cannot return more than 100 items, please use pagination.'
      )

    // Load priority commits first
    let priorityCommitPromise: Optional<
      ReturnType<typeof deps.getSpecificBranchCommits>
    > = undefined
    const loadPriorityIds = params.filter?.priorityIds && !params.cursor
    if (params.filter?.priorityIds && loadPriorityIds) {
      priorityCommitPromise = deps.getSpecificBranchCommits(
        params.filter.priorityIds.map((i) => ({
          branchId: params.branchId,
          commitId: i
        }))
      )
    }

    const priorityIdsOnly = loadPriorityIds && params.filter?.priorityIdsOnly
    const [results, totalCount, priorityCommits] = await Promise.all([
      !priorityIdsOnly
        ? deps.getPaginatedBranchCommitsItems({
            ...params,
            filter: {
              ...(params.filter || {}),
              // If we loaded priority commits first, exclude them from base results
              excludeIds: params.filter?.priorityIds || undefined
            }
          })
        : { commits: [], cursor: null },
      !priorityIdsOnly
        ? deps.getBranchCommitsTotalCount(params)
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

export const getBranchCommitsTotalCountByNameFactory =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    getBranchCommitsTotalCount: GetBranchCommitsTotalCount
  }): GetBranchCommitsTotalCountByName =>
  async ({ streamId, branchName }) => {
    branchName = branchName.toLowerCase()
    const myBranch = await deps.getStreamBranchByName(streamId, branchName)

    if (!myBranch)
      throw new BranchNotFoundError(`Failed to find branch with name ${branchName}.`)
    return deps.getBranchCommitsTotalCount({ branchId: myBranch.id })
  }

export const getPaginatedBranchCommitsItemsByNameFactory =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    getPaginatedBranchCommitsItems: GetPaginatedBranchCommitsItems
  }): GetPaginatedBranchCommitsItemsByName =>
  async ({ streamId, branchName, limit, cursor }) => {
    branchName = branchName.toLowerCase()
    const myBranch = await deps.getStreamBranchByName(streamId, branchName)

    if (!myBranch)
      throw new BranchNotFoundError(`Failed to find branch with name ${branchName}.`)

    return deps.getPaginatedBranchCommitsItems({ branchId: myBranch.id, limit, cursor })
  }

export const getServerTotalVersionCountFactory =
  (): GetTotalVersionCount => async () => {
    const allDbs = await getAllRegisteredDbClients()
    const allDbCounts = await Promise.all(
      Object.values(allDbs).map(async ({ client: db }) => {
        const getTotalVersionCount = getTotalVersionCountFactory({ db })
        return await getTotalVersionCount()
      })
    )

    return sum(allDbCounts)
  }
