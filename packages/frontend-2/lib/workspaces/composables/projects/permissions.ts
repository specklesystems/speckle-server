import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type { UseCanCreateWorkspaceProject_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseCanCreateWorkspaceProject_Workspace on Workspace {
    permissions {
      canCreateProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanCreateWorkspaceProject = (params: {
  workspace: MaybeRef<
    MaybeNullOrUndefined<UseCanCreateWorkspaceProject_WorkspaceFragment>
  >
}) => {
  // errors that have special disclaimers on click
  const disclaimerErrors: string[] = [WorkspaceLimitsReachedError.code]

  const canClickCreate = computed(() => {
    const check = unref(params.workspace)?.permissions?.canCreateProject
    if (!check) return false

    if (disclaimerErrors.includes(check.code)) {
      return true // we block the user downstream w/ a modal
    }

    return check.authorized
  })

  const canActuallyCreate = computed(
    () => !!unref(params.workspace)?.permissions?.canCreateProject.authorized
  )

  const cantClickCreateCode = computed(() => {
    const check = unref(params.workspace)?.permissions?.canCreateProject
    if (check?.authorized) return undefined

    return check?.code || 'UNKNOWN'
  })

  const cantClickCreateReason = computed(() => {
    const check = unref(params.workspace)?.permissions?.canCreateProject
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
