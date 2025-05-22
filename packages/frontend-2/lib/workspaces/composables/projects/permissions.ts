import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseCanCreateWorkspaceProject_WorkspaceFragment,
  UseCanMoveProjectIntoWorkspace_ProjectFragment,
  UseCanMoveProjectIntoWorkspace_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseCanCreateWorkspaceProject_Workspace on Workspace {
    permissions {
      canCreateProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

// TODO: Refactor duplicates

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

graphql(`
  fragment UseCanMoveProjectIntoWorkspace_Workspace on Workspace {
    permissions {
      canMoveProjectToWorkspace {
        ...FullPermissionCheckResult
      }
    }
  }
`)

graphql(`
  fragment UseCanMoveProjectIntoWorkspace_Project on Project {
    permissions {
      canMoveToWorkspace {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useCanMoveProjectIntoWorkspace = (params: {
  workspace?: MaybeRef<
    MaybeNullOrUndefined<UseCanMoveProjectIntoWorkspace_WorkspaceFragment>
  >
  project?: MaybeRef<
    MaybeNullOrUndefined<UseCanMoveProjectIntoWorkspace_ProjectFragment>
  >
}) => {
  // errors that have special disclaimers on click
  const disclaimerErrors: string[] = [WorkspaceLimitsReachedError.code]

  const check = computed(() => {
    const checks = [
      unref(params.workspace)?.permissions?.canMoveProjectToWorkspace,
      unref(params.project)?.permissions?.canMoveToWorkspace
    ]
    const existing = checks.find((c) => !!c)
    if (!existing) return undefined

    const failing = checks.find((c) => c && !c.authorized)
    if (failing) return failing

    return existing
  })

  const canClickMove = computed(() => {
    if (!check.value) return false

    if (disclaimerErrors.includes(check.value.code)) {
      return true // we block the user downstream w/ a modal
    }

    return check.value.authorized
  })

  const canActuallyMove = computed(
    () => !!unref(params.workspace)?.permissions?.canMoveProjectToWorkspace.authorized
  )

  const cantClickMoveCode = computed(() => {
    if (check.value?.authorized) return undefined

    return check.value?.code || 'UNKNOWN'
  })

  const cantClickMoveReason = computed(() => {
    if (check.value?.authorized) return undefined
    if (check.value && disclaimerErrors.includes(check.value.code)) return undefined

    return check.value?.message || 'Cannot move projects into workspace'
  })

  return {
    canClickMove,
    canActuallyMove,
    cantClickMoveReason,
    cantClickMoveCode
  }
}
