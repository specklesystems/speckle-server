import {
  ModelsTreeItemCollection,
  ProjectModelsArgs,
  ProjectModelsTreeArgs,
  StreamBranchesArgs
} from '@/modules/core/graph/generated/graphql'
import { UserInputError } from 'apollo-server-core'
import { getBranchesByStreamId } from '@/modules/core/services/branches'
import {
  getStructuredProjectModels,
  getPaginatedProjectModelsItems,
  getPaginatedProjectModelsTotalCount,
  getModelTreeItemsFiltered,
  getModelTreeItems,
  getModelTreeItemsFilteredTotalCount,
  getModelTreeItemsTotalCount
} from '@/modules/core/repositories/branches'
import { last } from 'lodash'
import { Merge } from 'type-fest'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'

export async function getStructuredStreamModels(streamId: string) {
  return getStructuredProjectModels(streamId)
}

export async function getPaginatedStreamBranches(
  streamId: string,
  params: StreamBranchesArgs
) {
  if (params.limit && params.limit > 100)
    throw new UserInputError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { items, cursor, totalCount } = await getBranchesByStreamId({
    streamId,
    limit: params.limit,
    cursor: params.cursor
  })

  return { totalCount, cursor, items }
}

export async function getPaginatedProjectModels(
  projectId: string,
  params: ProjectModelsArgs
) {
  const [totalCount, itemsStruct] = await Promise.all([
    getPaginatedProjectModelsTotalCount(projectId, params),
    getPaginatedProjectModelsItems(projectId, params)
  ])

  return {
    ...itemsStruct,
    totalCount
  }
}

export async function getProjectTopLevelModelsTree(
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{ filterOutEmptyMain: boolean }>
): Promise<Merge<ModelsTreeItemCollection, { items: ModelsTreeItemGraphQLReturn[] }>> {
  const [items, totalCount] = await Promise.all([
    args.filter?.search
      ? getModelTreeItemsFiltered(
          projectId,
          {
            ...args,
            filter: {
              search: args.filter.search
            }
          },
          options
        )
      : getModelTreeItems(projectId, args, options),
    args.filter?.search
      ? getModelTreeItemsFilteredTotalCount(
          projectId,
          {
            ...args,
            filter: {
              search: args.filter.search
            }
          },
          options
        )
      : getModelTreeItemsTotalCount(projectId, options)
  ])

  const lastItem = last(items)
  return {
    items,
    totalCount,
    cursor: lastItem ? lastItem.updatedAt.toISOString() : null
  }
}
