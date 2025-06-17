import {
  decodeIsoDateCursor,
  encodeIsoDateCursor,
  Collection
} from '@/modules/shared/helpers/graphqlHelper'

type GetPaginatedItemsArgs = {
  limit: number
  cursor?: string
}

/**
 * @deprecated This doesn't support composite cursors and as such breaks pagination in certain cases. Either create
 * your own custom implementation or create a new general paginated items util that allows getItems to encode/decode
 * cursor its own way and return the cursor back out from the function.
 */
export const getPaginatedItemsFactory =
  <TArgs extends GetPaginatedItemsArgs, T extends { createdAt: Date }>({
    getItems,
    getTotalCount
  }: {
    getItems: (args: TArgs) => Promise<T[]>
    getTotalCount: (args: Omit<TArgs, 'cursor' | 'limit'>) => Promise<number>
  }) =>
  async (args: TArgs): Promise<Collection<T>> => {
    const totalCount = await getTotalCount(args)
    if (args.limit === 0) {
      return {
        cursor: null,
        items: [],
        totalCount
      }
    }
    const maybeDecodedCursor = args.cursor ? decodeIsoDateCursor(args.cursor) : null
    const items = await getItems({
      ...args,
      cursor: maybeDecodedCursor ?? undefined
    })

    let cursor = null
    if (items.length === args.limit) {
      const lastItem = items.at(-1)
      cursor = lastItem ? encodeIsoDateCursor(lastItem.createdAt) : null
    }

    return {
      items,
      cursor,
      totalCount
    }
  }
