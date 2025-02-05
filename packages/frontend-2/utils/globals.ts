import type { RouteLocationNormalized } from 'vue-router'
import { noop } from 'lodash-es'
import { wrapRefWithTracking } from '~/lib/common/helpers/debugging'
import { ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage as getFirstGqlErrorMessage,
  modifyObjectField,
  ROOT_MUTATION,
  ROOT_QUERY,
  ROOT_SUBSCRIPTION
} from '~/lib/common/helpers/graphql'

/**
 * Debugging helper to ensure variables are available in debugging scope
 */
export const markUsed = noop

/**
 * Will attempt to resolve the current route definition in various ways.
 */
export const getRouteDefinition = (route?: RouteLocationNormalized) => {
  const matchedPath = route ? route.matched[route.matched.length - 1]?.path : undefined
  return matchedPath || '/404'
}

export {
  ToastNotificationType,
  wrapRefWithTracking,
  noop,
  convertThrowIntoFetchResult,
  getFirstGqlErrorMessage,
  modifyObjectField,
  getCacheId,
  ROOT_QUERY,
  ROOT_MUTATION,
  ROOT_SUBSCRIPTION
}
