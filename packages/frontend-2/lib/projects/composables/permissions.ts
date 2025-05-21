import type { MaybeNullOrUndefined } from '@speckle/shared'
import { PersonalProjectsLimitedError } from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type { UseCanCreatePersonalProject_UserFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseCanCreatePersonalProject_User on User {
    permissions {
      canCreatePersonalProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanCreatePersonalProject = (params: {
  activeUser: MaybeRef<MaybeNullOrUndefined<UseCanCreatePersonalProject_UserFragment>>
}) => {
  // errors that have special disclaimers on click
  const disclaimerErrors: string[] = [PersonalProjectsLimitedError.code]

  const canClickCreate = computed(() => {
    const check = unref(params.activeUser)?.permissions?.canCreatePersonalProject
    if (!check) return false

    if (disclaimerErrors.includes(check.code)) {
      return true // we block the user downstream w/ a modal
    }

    return check.authorized
  })

  const canActuallyCreate = computed(
    () => !!unref(params.activeUser)?.permissions?.canCreatePersonalProject.authorized
  )

  const cantClickCreateCode = computed(() => {
    const check = unref(params.activeUser)?.permissions?.canCreatePersonalProject
    if (check?.authorized) return undefined

    return check?.code || 'UNKNOWN'
  })

  const cantClickCreateReason = computed(() => {
    const check = unref(params.activeUser)?.permissions?.canCreatePersonalProject
    if (check?.authorized) return undefined
    if (check && disclaimerErrors.includes(check.code)) return undefined

    return check?.message || 'Cannot create personal project'
  })

  return {
    canClickCreate,
    canActuallyCreate,
    cantClickCreateReason,
    cantClickCreateCode
  }
}
