import type { InjectableViewerState } from '~/lib/viewer/composables/setup'

/**
 * Keeping some core Viewer state code here so that we can import it without
 * importing the entire Viewer state related codebase. Useful in embed mode where
 * we don't want to load all of the Viewer JS before the Play button is pressed.
 */

/**
 * Vue injection key for the Injectable Viewer State
 */
export const InjectableViewerStateKey: InjectionKey<InjectableViewerState> = Symbol(
  'INJECTABLE_VIEWER_STATE'
)

/**
 * Use this when you want to use the viewer state outside the viewer, ie in a component that's inside a portal!
 * @param state
 */
export function useSetupViewerScope(
  state: InjectableViewerState
): InjectableViewerState {
  provide(InjectableViewerStateKey, state)
  return state
}

export type { InjectableViewerState }
