import {
  ProjectModelsArgs,
  StreamBranchesArgs
} from '@/modules/core/graph/generated/graphql'
import { UserInputError } from 'apollo-server-core'
import { getBranchesByStreamId } from '@/modules/core/services/branches'
import {
  getPaginatedProjectModelsItems,
  getPaginatedProjectModelsTotalCount
} from '@/modules/core/repositories/branches'

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
