import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  PersonalProjectsLimitedError,
  WorkspaceLimitsReachedError
} from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseCanCreateModel_ProjectFragment,
  UseCanCreatePersonalProject_UserFragment
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseCanCreatePersonalProject_User on User {
    permissions {
      canCreatePersonalProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

// TODO: Cleanup these

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

graphql(`
  fragment UseCanCreateModel_Project on Project {
    id
    permissions {
      canCreateModel {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanCreateModel = (params: {
  project: MaybeRef<MaybeNullOrUndefined<UseCanCreateModel_ProjectFragment>>
}) => {
  // errors that have special disclaimers on click
  const disclaimerErrors: string[] = [
    WorkspaceLimitsReachedError.code,
    PersonalProjectsLimitedError.code
  ]

  const check = computed(() => unref(params.project)?.permissions?.canCreateModel)

  const canClickCreate = computed(() => {
    if (!check.value) return false

    if (disclaimerErrors.includes(check.value.code)) {
      return true // we block the user downstream w/ a modal
    }

    return check.value.authorized
  })

  const canActuallyCreate = computed(() => !!check.value?.authorized)

  const cantClickCreateCode = computed(() => {
    if (check.value?.authorized) return undefined

    return check.value?.code || 'UNKNOWN'
  })

  const cantClickCreateReason = computed(() => {
    if (check.value?.authorized) return undefined
    if (check.value && disclaimerErrors.includes(check.value.code)) return undefined

    return check.value?.message || 'Cannot create personal project'
  })

  return {
    canClickCreate,
    canActuallyCreate,
    cantClickCreateReason,
    cantClickCreateCode
  }
}
