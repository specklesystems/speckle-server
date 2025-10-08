import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  PersonalProjectsLimitedError,
  PersonalProjectsLimits,
  WorkspaceLimitsReachedError
} from '@speckle/shared/authz'
import { usePermissionedAction } from '~/lib/common/composables/permissions'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { useCanCreateWorkspaceQuery } from '~/lib/workspaces/graphql/queries'
import type {
  UseCanCreateModel_ProjectFragment,
  UseCanCreatePersonalProject_UserFragment,
  UseCanInviteToProject_ProjectFragment
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

export const useCanCreatePersonalProject = (params: {
  activeUser: MaybeRef<MaybeNullOrUndefined<UseCanCreatePersonalProject_UserFragment>>
}) => {
  const {
    canClickAction: canClickCreate,
    canActuallyInvokeAction: canActuallyCreate,
    cantClickErrorReason: cantClickCreateReason,
    cantClickErrorCode: cantClickCreateCode
  } = usePermissionedAction({
    check: computed(
      () => unref(params.activeUser)?.permissions?.canCreatePersonalProject
    ),
    disclaimerErrorCodes: [PersonalProjectsLimitedError.code],
    fallbackReason: 'Cannot create personal project'
  })

  return {
    canClickCreate,
    canActuallyCreate,
    cantClickCreateReason,
    cantClickCreateCode
  }
}

graphql(`
  fragment UseCanCreateWorkspace_User on User {
    permissions {
      canCreateWorkspace {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanCreateWorkspace = () => {
  const { result, loading } = useQuery(useCanCreateWorkspaceQuery)

  const {
    canClickAction: canClickCreate,
    canActuallyInvokeAction: canActuallyCreate,
    cantClickErrorReason: cantClickCreateReason,
    cantClickErrorCode: cantClickCreateCode
  } = usePermissionedAction({
    check: computed(() => result.value?.activeUser?.permissions?.canCreateWorkspace),
    disclaimerErrorCodes: [PersonalProjectsLimitedError.code],
    fallbackReason: 'Cannot create workspace'
  })

  return {
    canClickCreate,
    canActuallyCreate,
    cantClickCreateReason,
    cantClickCreateCode,
    loading
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
  const {
    canClickAction: canClickCreate,
    canActuallyInvokeAction: canActuallyCreate,
    cantClickErrorReason: cantClickCreateReason,
    cantClickErrorCode: cantClickCreateCode
  } = usePermissionedAction({
    check: computed(() => unref(params.project)?.permissions?.canCreateModel),
    disclaimerErrorCodes: [
      WorkspaceLimitsReachedError.code,
      PersonalProjectsLimitedError.code
    ],
    fallbackReason: 'Cannot create model'
  })

  return {
    canClickCreate,
    canActuallyCreate,
    cantClickCreateReason,
    cantClickCreateCode
  }
}

graphql(`
  fragment UseCanInviteToProject_Project on Project {
    id
    permissions {
      canInvite {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanInviteToProject = (params: {
  project: MaybeRef<MaybeNullOrUndefined<UseCanInviteToProject_ProjectFragment>>
}) => {
  const {
    canClickAction: canClickInvite,
    canActuallyInvokeAction: canActuallyInvite,
    cantClickErrorReason: cantClickInviteReason,
    cantClickErrorCode: cantClickInviteCode
  } = usePermissionedAction({
    check: computed(() => unref(params.project)?.permissions?.canInvite),
    disclaimerErrorCodes: [PersonalProjectsLimitedError.code],
    fallbackReason: 'Cannot invite to project'
  })

  return {
    canClickInvite,
    canActuallyInvite,
    cantClickInviteReason,
    cantClickInviteCode
  }
}

export const usePersonalProjectLimits = () => {
  const {
    public: { FF_PERSONAL_PROJECTS_LIMITS_ENABLED }
  } = useRuntimeConfig()

  const limits = computed(() =>
    FF_PERSONAL_PROJECTS_LIMITS_ENABLED ? PersonalProjectsLimits : null
  )
  const versionLimitFormatted = computed(() => {
    const versionsHistory = limits.value?.versionsHistory
    if (!versionsHistory) return 'Unlimited'

    const { value, unit } = versionsHistory
    return `${value} ${unit}`
  })

  const commentLimitFormatted = computed(() => {
    const commentHistory = limits.value?.commentHistory
    if (!commentHistory) return 'Unlimited'

    const { value, unit } = commentHistory
    return `${value} ${unit}`
  })

  return {
    limits,
    versionLimitFormatted,
    commentLimitFormatted
  }
}
