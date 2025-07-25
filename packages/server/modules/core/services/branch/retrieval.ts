import type {
  ModelsTreeItemCollection,
  ProjectModelsArgs,
  ProjectModelsTreeArgs,
  StreamBranchesArgs
} from '@/modules/core/graph/generated/graphql'
import { last, sum } from 'lodash-es'
import type { Merge } from 'type-fest'
import type { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { getMaximumProjectModelsPerPage } from '@/modules/shared/helpers/envHelper'
import { BadRequestError } from '@/modules/shared/errors'
import type {
  GetModelTreeItems,
  GetModelTreeItemsFiltered,
  GetModelTreeItemsFilteredTotalCount,
  GetModelTreeItemsTotalCount,
  GetPaginatedProjectModelsItems,
  GetPaginatedProjectModelsTotalCount,
  GetPaginatedStreamBranches,
  GetPaginatedStreamBranchesPage,
  GetProjectTopLevelModelsTree,
  GetStreamBranchCount,
  GetTotalModelCount
} from '@/modules/core/domain/branches/operations'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { getTotalModelCountFactory } from '@/modules/core/repositories/branches'

export const getPaginatedStreamBranchesFactory =
  (deps: {
    getPaginatedStreamBranchesPage: GetPaginatedStreamBranchesPage
    getStreamBranchCount: GetStreamBranchCount
  }): GetPaginatedStreamBranches =>
  async (streamId: string, params?: StreamBranchesArgs) => {
    const maxProjectModelsPerPage = getMaximumProjectModelsPerPage()
    if (params?.limit && params.limit > maxProjectModelsPerPage)
      throw new BadRequestError(
        `Cannot return more than ${maxProjectModelsPerPage} items, please use pagination.`
      )

    const { items, cursor } = await deps.getPaginatedStreamBranchesPage({
      streamId,
      limit: params?.limit,
      cursor: params?.cursor
    })
    const totalCount = await deps.getStreamBranchCount(streamId)

    return { totalCount, cursor, items }
  }

export const getPaginatedProjectModelsFactory =
  (deps: {
    getPaginatedProjectModelsItems: GetPaginatedProjectModelsItems
    getPaginatedProjectModelsTotalCount: GetPaginatedProjectModelsTotalCount
  }) =>
  async (projectId: string, params: ProjectModelsArgs) => {
    const [totalCount, itemsStruct] = await Promise.all([
      deps.getPaginatedProjectModelsTotalCount(projectId, params),
      deps.getPaginatedProjectModelsItems(projectId, params)
    ])

    return {
      ...itemsStruct,
      totalCount
    }
  }

export const getProjectTopLevelModelsTreeFactory =
  (deps: {
    getModelTreeItemsFiltered: GetModelTreeItemsFiltered
    getModelTreeItemsFilteredTotalCount: GetModelTreeItemsFilteredTotalCount
    getModelTreeItems: GetModelTreeItems
    getModelTreeItemsTotalCount: GetModelTreeItemsTotalCount
  }): GetProjectTopLevelModelsTree =>
  async (
    projectId: string,
    args: ProjectModelsTreeArgs,
    options?: Partial<{ filterOutEmptyMain: boolean }>
  ): Promise<
    Merge<ModelsTreeItemCollection, { items: ModelsTreeItemGraphQLReturn[] }>
  > => {
    let items: ModelsTreeItemGraphQLReturn[] = []
    let totalCount = 0

    if (
      args.filter?.search ||
      args.filter?.contributors?.length ||
      args.filter?.sourceApps?.length
    ) {
      const [filteredItems, filteredTotalCount] = await Promise.all([
        deps.getModelTreeItemsFiltered(projectId, args, options),
        deps.getModelTreeItemsFilteredTotalCount(projectId, args, options)
      ])

      items = filteredItems
      totalCount = filteredTotalCount
    } else {
      const [unfilteredItems, unfilteredTotalCount] = await Promise.all([
        deps.getModelTreeItems(projectId, args, options),
        deps.getModelTreeItemsTotalCount(projectId, options)
      ])

      items = unfilteredItems
      totalCount = unfilteredTotalCount
    }

    const lastItem = last(items)
    return {
      items,
      totalCount,
      cursor: lastItem ? lastItem.updatedAt.toISOString() : null
    }
  }

export const getServerTotalModelCountFactory = (): GetTotalModelCount => async () => {
  const allDbs = await getAllRegisteredDbClients()
  const allDbCounts = await Promise.all(
    Object.values(allDbs).map(async ({ client: db }) => {
      const getTotalModelCount = getTotalModelCountFactory({ db })
      return await getTotalModelCount()
    })
  )

  return sum(allDbCounts)
}
