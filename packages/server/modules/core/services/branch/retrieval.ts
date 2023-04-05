import {
  ProjectModelsArgs,
  StreamBranchesArgs
} from '@/modules/core/graph/generated/graphql'
import { UserInputError } from 'apollo-server-core'
import { getBranchesByStreamId } from '@/modules/core/services/branches'
import {
  getStructuredProjectModels,
  getPaginatedProjectModelsItems,
  getPaginatedProjectModelsTotalCount,
  getModelTreeItemsFiltered,
  getModelTreeItems
} from '@/modules/core/repositories/branches'
import { getStreamPendingModels } from '@/modules/fileuploads/repositories/fileUploads'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { last } from 'lodash'

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

export async function getProjectModelsTree(
  projectId: string,
  filter?: Partial<{
    search: string
    parentModelName: string
  }>,
  options?: Partial<{ filterOutEmptyMain: boolean }>
) {
  // TODO: We can support searching for uploads as well, but we don't have that
  // support in the paginated models query, so scrapping it for now
  // TODO: We can support nesting uploads, but needs more work
  // const branchNamePattern = `${filter?.parentModelName || ''}${
  //   filter?.search ? `.*${filter.search}.*` : ``
  // }`
  // const branchNamePattern = filter?.search ? `.*${filter.search}.*` : undefined

  const [baseModelItems, pendingModelItems] = await Promise.all([
    filter?.search
      ? getModelTreeItemsFiltered(projectId, filter.search, options)
      : getModelTreeItems(projectId, filter?.parentModelName, options),
    !filter?.parentModelName && !filter?.search
      ? getStreamPendingModels(projectId).then((res) =>
          res.map(
            (i): ModelsTreeItemGraphQLReturn => ({
              id: `${i.streamId}-${i.branchName}`,
              projectId,
              name: last(i.branchName.split('/')) as string,
              fullName: i.branchName,
              updatedAt: i.convertedLastUpdate || i.uploadDate,
              hasChildren: false,
              isPendingModel: true,
              pendingModel: i
            })
          )
        )
      : []
  ])

  return [...pendingModelItems, ...baseModelItems]
}
