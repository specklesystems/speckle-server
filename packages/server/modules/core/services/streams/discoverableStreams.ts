import {
  DiscoverableStreamsSortingInput,
  DiscoverableStreamsSortType,
  QueryDiscoverableStreamsArgs,
  SortDirection
} from '@/modules/core/graph/generated/graphql'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  countDiscoverableStreams,
  GetDiscoverableStreamsParams,
  getDiscoverableStreams as getDiscoverableStreamsQuery,
  encodeDiscoverableStreamsCursor
} from '@/modules/core/repositories/streams'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { clamp } from 'lodash'

type StreamCollection = {
  cursor: Nullable<string>
  totalCount: number
  items: StreamRecord[]
}

function buildRetrievalSortingParams(
  args: QueryDiscoverableStreamsArgs
): DiscoverableStreamsSortingInput {
  return (
    args.sort || {
      type: DiscoverableStreamsSortType.CreatedDate,
      direction: SortDirection.Desc
    }
  )
}

function formatRetrievalParams(
  args: QueryDiscoverableStreamsArgs
): GetDiscoverableStreamsParams {
  return {
    sort: buildRetrievalSortingParams(args),
    cursor: args.cursor || null,
    limit: clamp(args.limit || 25, 1, 100)
  }
}

/**
 * Retrieve discoverable streams
 */
export async function getDiscoverableStreams(
  args: QueryDiscoverableStreamsArgs
): Promise<StreamCollection> {
  const params = formatRetrievalParams(args)
  const [items, totalCount] = await Promise.all([
    getDiscoverableStreamsQuery(params),
    countDiscoverableStreams()
  ])

  const cursor = encodeDiscoverableStreamsCursor(params.sort.type, items, params.cursor)

  return {
    totalCount,
    cursor,
    items
  }
}
