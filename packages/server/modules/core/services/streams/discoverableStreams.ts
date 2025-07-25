import type {
  CountDiscoverableStreams,
  GetDiscoverableStreams,
  GetDiscoverableStreamsPage,
  GetDiscoverableStreamsParams
} from '@/modules/core/domain/streams/operations'
import type {
  DiscoverableStreamsSortingInput,
  QueryDiscoverableStreamsArgs
} from '@/modules/core/graph/generated/graphql'
import {
  DiscoverableStreamsSortType,
  SortDirection
} from '@/modules/core/graph/generated/graphql'
import type { StreamRecord } from '@/modules/core/helpers/types'
import { encodeDiscoverableStreamsCursor } from '@/modules/core/repositories/streams'
import type { Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import { clamp } from 'lodash-es'

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
  args: QueryDiscoverableStreamsArgs,
  streamIdWhitelist?: Optional<string[]>
): GetDiscoverableStreamsParams {
  return {
    sort: buildRetrievalSortingParams(args),
    cursor: args.cursor || null,
    limit: clamp(args.limit || 25, 1, 100),
    streamIdWhitelist
  }
}

/**
 * Retrieve discoverable streams
 */
export const getDiscoverableStreamsFactory =
  (deps: {
    getDiscoverableStreamsPage: GetDiscoverableStreamsPage
    countDiscoverableStreams: CountDiscoverableStreams
  }): GetDiscoverableStreams =>
  async (
    args: QueryDiscoverableStreamsArgs,
    streamIdWhitelist?: Optional<string[]>
  ): Promise<StreamCollection> => {
    const params = formatRetrievalParams(args, streamIdWhitelist)
    const [items, totalCount] = await Promise.all([
      deps.getDiscoverableStreamsPage(params),
      deps.countDiscoverableStreams(params)
    ])

    const cursor = encodeDiscoverableStreamsCursor(
      params.sort.type,
      items,
      params.cursor
    )

    return {
      totalCount,
      cursor,
      items
    }
  }
