import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { FullPermissionCheckResultFragment } from '~/lib/common/generated/gql/graphql'

export const usePermissionedAction = (
  params: (
    | {
        /**
         * Auth policy result that the check should be based on.
         */
        check: MaybeRef<MaybeNullOrUndefined<FullPermissionCheckResultFragment>>
      }
    | {
        /**
         * Auth policy results that the check should be based on. Multiple checks will
         * be combined, with the failing one taking precedence.
         */
        checks: MaybeRef<MaybeNullOrUndefined<FullPermissionCheckResultFragment>[]>
      }
  ) & {
    /**
     * Auth policy result error codes that should result in a special edge case (e.g. disclaimer popup)
     * when the action is invoked. In these cases the action will be allowed to be invoked.
     */
    disclaimerErrorCodes: string[]
    /**
     * If no checks can be resolved (loading?), treat the action as allowed.
     * Default: false
     */
    allowOnMissingCheck?: boolean
    fallbackReason?: string
  }
) => {
  const check = computed(() => {
    if ('check' in params) return unref(params.check)

    const checks = unref(params.checks)
    const existing = checks?.find((c) => !!c)
    if (!existing) return undefined

    const failing = checks?.find((c) => c && !c.authorized)
    if (failing) return failing

    return existing
  })

  /**
   * Will return true also if disclaimer error codes are hit. The click should lead
   * to the disclaimer edge case, instead of the actual action occurring.
   */
  const canClickAction = computed(() => {
    if (!check.value) return !!params.allowOnMissingCheck

    if (params.disclaimerErrorCodes.includes(check.value.code)) {
      return true // we block the user downstream w/ a modal
    }

    return check.value.authorized
  })

  /**
   * Whether the action can actually be invoked. Only true if there are no errors,
   * disclaimer or otherwise.
   */
  const canActuallyInvokeAction = computed(() =>
    check.value ? check.value?.authorized : !!params.allowOnMissingCheck
  )

  const cantClickErrorCode = computed(() => {
    if (check.value?.authorized) return undefined
    return check.value?.code || 'UNKNOWN'
  })

  const cantClickErrorReason = computed(() => {
    if (check.value?.authorized) return undefined
    if (check.value && params.disclaimerErrorCodes.includes(check.value.code))
      return undefined

    return check.value?.message || params.fallbackReason || 'Cannot perform action'
  })

  return {
    canClickAction,
    canActuallyInvokeAction,
    cantClickErrorCode,
    cantClickErrorReason,
    check
  }
}
