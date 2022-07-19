import { Optional } from '@/helpers/typeHelpers'
import { FieldMergeFunction } from '@apollo/client/core'

interface AbstractCollection<T extends string> {
  __typename: T
  totalCount: number
  cursor: string | null
  items: Record<string, unknown>[]
}

/**
 * Build an Apollo merge function for a field that returns a collection like AbstractCollection
 * @param {{}} [param0]
 * @param {boolean} [param0.checkIdentity] Set to true if you want to double check that items with IDs
 * that already appear in old results, don't get added again
 * @param {string} [param0.identityProp] Optionally change the prop that should be used to compare
 * equality between items
 */
export function buildAbstractCollectionMergeFunction<T extends string>(
  typeName: T,
  { checkIdentity = false, identityProp = '__ref' } = {}
): FieldMergeFunction<Optional<AbstractCollection<T>>, AbstractCollection<T>> {
  return (
    existing: Optional<AbstractCollection<T>>,
    incoming: AbstractCollection<T>
  ) => {
    const existingItems = existing?.items || []
    const incomingItems = incoming?.items || []

    let finalItems: Record<string, unknown>[]
    if (checkIdentity) {
      finalItems = [...existingItems]
      for (const newItem of incomingItems) {
        if (
          finalItems.findIndex(
            (item) => item[identityProp] === newItem[identityProp]
          ) === -1
        ) {
          finalItems.push(newItem)
        }
      }
    } else {
      finalItems = [...existingItems, ...incomingItems]
    }

    return {
      __typename: incoming?.__typename || existing?.__typename || typeName,
      totalCount: incoming.totalCount || 0,
      cursor: incoming.cursor || null,
      items: finalItems
    }
  }
}

/**
 * Merge function that just takes incoming data and overrides all of old data with it
 * Useful for array fields w/o pagination, where a new array response is supposed to replace
 * the entire old one
 */
export const incomingOverwritesExistingMergeFunction: FieldMergeFunction = (
  _existing: unknown,
  incoming: unknown
) => incoming
