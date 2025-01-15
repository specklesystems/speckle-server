import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/graphqlHelper'

type Collection<T> = {
  cursor: string | null
  totalCount: number
  items: T[]
}

type GetPaginatedItemsArgs = {
  limit: number
  cursor?: string
}

export const getPaginatedItemsFactory =
  <TArgs extends GetPaginatedItemsArgs, T extends { createdAt: Date }>({
    getItems,
    getTotalCount
  }: {
    getItems: (args: TArgs) => Promise<T[]>
    getTotalCount: (args: Omit<TArgs, 'cursor' | 'limit'>) => Promise<number>
  }) =>
  async (args: TArgs): Promise<Collection<T>> => {
    const maybeDecodedCursor = args.cursor ? decodeIsoDateCursor(args.cursor) : null
    const items = await getItems({
      ...args,
      cursor: maybeDecodedCursor ?? undefined
    })
    const totalCount = await getTotalCount(args)

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
