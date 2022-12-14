import { StreamCommitsArgs } from '@/modules/core/graph/generated/graphql'
import {
  getCommitsByStreamId,
  getCommitsTotalCountByStreamId
} from '@/modules/core/services/commits'
import { UserInputError } from 'apollo-server-core'

export async function getPaginatedStreamCommits(
  streamId: string,
  params: StreamCommitsArgs
) {
  if (params.limit && params.limit > 100)
    throw new UserInputError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { commits: items, cursor } = await getCommitsByStreamId({
    streamId,
    limit: params.limit,
    cursor: params.cursor,
    ignoreGlobalsBranch: true
  })
  const totalCount = await getCommitsTotalCountByStreamId({
    streamId,
    ignoreGlobalsBranch: true
  })

  return { items, cursor, totalCount }
}
