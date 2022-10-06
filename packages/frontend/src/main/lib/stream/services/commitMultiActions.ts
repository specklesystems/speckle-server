import { ApolloCache } from '@apollo/client/cache'

export enum BatchActionType {
  Move = 'move',
  Delete = 'delete'
}

export function deleteCommitsFromCachedCommitsQuery(
  cache: ApolloCache<unknown>,
  parentObjectCacheId: string,
  commitIds: string[]
) {
  cache.modify({
    id: parentObjectCacheId,
    fields: {
      commits(oldCommits: { totalCount: number; items: Array<{ __ref: string }> }) {
        const newTotalCount = Math.max(oldCommits.totalCount - commitIds.length, 0)

        // old items don't hold the ID prop, but a __ref prop like this 'Commit:XXXXX'
        const newItems = oldCommits.items.filter(
          (c) => !commitIds.includes(c.__ref.split(':')[1])
        )

        return {
          ...oldCommits,
          totalCount: newTotalCount,
          items: newItems
        }
      }
    }
  })
}
