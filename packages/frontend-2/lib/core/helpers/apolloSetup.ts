import type { Optional } from '@speckle/shared'
import type { FieldMergeFunction } from '@apollo/client/core'
import { get, has } from 'lodash-es'

interface AbstractCollection<T extends string> {
  __typename: T
  totalCount: number
  cursor: string | null
  items: Record<string, unknown>[]
}

interface MergeSettings {
  /**
   * Set to false if you want to merge incoming items without checking
   * for duplicates. Usually you don't want to do this as you can introduce duplicates this way.
   * Defaults to true
   */
  checkIdentity: boolean
  /**
   * Optionally change the prop that should be used to compare
   * equality between items
   * Defaults to '__ref', which is the prop added by Apollo that contains the globally unique ID of the object
   */
  identityProp: string
}

const prepareMergeSettings = (
  settings: Optional<Partial<MergeSettings>>
): MergeSettings => ({
  checkIdentity: true,
  identityProp: '__ref',
  ...(settings || {})
})

/**
 * Build an Apollo merge function for a field that returns an array of identifiable objects
 */
export function buildArrayMergeFunction(
  settings?: Partial<MergeSettings>
): FieldMergeFunction<Record<string, unknown>[], Record<string, unknown>[]> {
  const { checkIdentity, identityProp } = prepareMergeSettings(settings)
  return (existing, incoming) => {
    let finalItems: Record<string, unknown>[]
    if (checkIdentity) {
      finalItems = [...(existing || [])]
      for (const newItem of incoming || []) {
        if (
          finalItems.findIndex(
            (item) => item[identityProp] === newItem[identityProp]
          ) === -1
        ) {
          finalItems.push(newItem)
        }
      }
    } else {
      finalItems = [...(existing || []), ...(incoming || [])]
    }

    return finalItems
  }
}

/**
 * Build an Apollo merge function for a field that returns a collection like AbstractCollection
 */
export function buildAbstractCollectionMergeFunction<T extends string>(
  typeName: T,
  settings?: Partial<MergeSettings>
): FieldMergeFunction<Optional<AbstractCollection<T>>, AbstractCollection<T>> {
  const { checkIdentity, identityProp } = prepareMergeSettings(settings)

  const resolveCursor = (
    args: Record<string, unknown> | null
  ): string | null | undefined => {
    if (!args) return undefined
    if (has(args, 'cursor')) return get(args, 'cursor') as string | null
    if (has(args, 'input.cursor')) return get(args, 'input.cursor') as string | null
    if (has(args, 'filter.cursor')) return get(args, 'filter.cursor') as string | null
    return undefined
  }

  const merge: FieldMergeFunction<
    Optional<AbstractCollection<T>>,
    AbstractCollection<T>
  > = (existing, incoming, options) => {
    // If incoming data was requested w/ cursor: null, its the very first page and should replace whatever existed before
    const cursor = resolveCursor(options.args)
    const shouldReplace = cursor === null

    let finalItems: Record<string, unknown>[] | undefined = undefined
    if (existing?.items || incoming?.items) {
      const existingItems = existing?.items || []
      const incomingItems = incoming?.items || []

      if (shouldReplace) {
        finalItems = [...incomingItems]
      } else {
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
      }
    }

    return {
      ...(incoming || {}),
      ...(finalItems ? { items: finalItems } : {}),
      __typename: incoming?.__typename || existing?.__typename || typeName
    }
  }

  return merge
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

export const mergeAsObjectsFunction: FieldMergeFunction = (existing, incoming) => ({
  ...existing,
  ...incoming
})
