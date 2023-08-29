import { ApolloCache, Modifier, Reference } from '@apollo/client/cache'

export const disabledCheckboxMessage =
  "To select this commit you must be its or its stream's owner"

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
      commits: ((
        oldCommits:
          | {
              totalCount: number
              items: Array<{ __ref: string }>
            }
          | Reference,
        { isReference }
      ) => {
        if (isReference(oldCommits)) return oldCommits

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
      }) as Modifier<
        { totalCount: number; items: Array<{ __ref: string }> } | Reference
      >
    }
  })
}
