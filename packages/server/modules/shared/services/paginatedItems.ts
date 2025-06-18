import { Collection } from '@/modules/shared/helpers/graphqlHelper'
import { MaybeNullOrUndefined } from '@speckle/shared'

type GetPaginatedItemsArgs = {
  limit: number
  cursor?: MaybeNullOrUndefined<string>
}

export const getPaginatedItemsFactory =
  <TArgs extends GetPaginatedItemsArgs, T>({
    getItems,
    getTotalCount
  }: {
    getItems: (args: TArgs) => Promise<{ items: T[]; cursor: string | null }>
    getTotalCount: (args: Omit<TArgs, 'cursor' | 'limit'>) => Promise<number>
  }) =>
  async (args: TArgs): Promise<Collection<T>> => {
    const [totalCount, { items, cursor }] = await Promise.all([
      getTotalCount(args),
      args.limit === 0 ? { cursor: null, items: [] } : getItems(args)
    ])

    return {
      items,
      cursor,
      totalCount
    }
  }
