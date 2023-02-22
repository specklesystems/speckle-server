import { GetReactiveVarType, Nullable } from '@/helpers/typeHelpers'
import { makeVar, TypePolicies } from '@apollo/client/cache'
import type { PropertyInfo, FilteringState } from '@speckle/viewer'
import emojis from '@/main/store/emojis'

/**
 * Actual state from state manager. Extracted here to ensure that we don't bundle the full viewer & three.js
 * on every page just to initialize the state.
 *
 * BE VERY CAREFUL AND KEEP THIS MODULE LIGHTWEIGHT. IMPORTING TYPES FROM VIEWER/THREE IS FINE AS LONG
 * AS YOU USE `import type {...}`.
 */

type UnknownObject = Record<string, unknown>

/**
 * Queryable Apollo Client state.
 *
 * Do not use directly! Use GQL queries to read and stateManager.ts mutators to mutate.
 */
export const commitObjectViewerState = makeVar({
  viewerBusy: false,
  selectedCommentMetaData: null as Nullable<{
    id: number
    selectionLocation: Record<string, unknown>
  }>,
  addingComment: false,
  preventCommentCollapse: false,
  commentReactions: ['❤️', '✏️', '🔥', '⚠️'],
  emojis,
  // New viewer & filter vars
  currentFilterState: null as Nullable<FilteringState>,
  selectedObjects: [] as UnknownObject[],
  objectProperties: [] as PropertyInfo[],
  localFilterPropKey: null as Nullable<string>,
  sectionBox: false
})

export type StateType = GetReactiveVarType<typeof commitObjectViewerState>

/**
 * Merge (through _.merge) these with the rest of your Apollo Client `typePolicies` to set up
 * commit object viewer state management
 */
export const statePolicies: TypePolicies = {
  Query: {
    fields: {
      commitObjectViewerState: {
        read() {
          return commitObjectViewerState()
        }
      }
    }
  }
}
