import { noop } from 'lodash-es'
import { wrapRefWithTracking } from '~/lib/common/helpers/debugging'
import { ToastNotificationType } from '~~/lib/common/composables/toast'

/**
 * Debugging helper to ensure variables are available in debugging scope
 */
export const markUsed = noop

export { ToastNotificationType, wrapRefWithTracking }
