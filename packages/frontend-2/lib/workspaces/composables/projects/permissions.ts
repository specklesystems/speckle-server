import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { usePermissionedAction } from '~/lib/common/composables/permissions'
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

export const useCanCreateWorkspaceProject = (params: {
  workspace: MaybeRef<
    MaybeNullOrUndefined<UseCanCreateWorkspaceProject_WorkspaceFragment>
  >
}) => {
  const {
    canClickAction: canClickCreate,
    canActuallyInvokeAction: canActuallyCreate,
    cantClickErrorReason: cantClickCreateReason,
    cantClickErrorCode: cantClickCreateCode
  } = usePermissionedAction({
    check: computed(() => unref(params.workspace)?.permissions?.canCreateProject),
    disclaimerErrorCodes: [WorkspaceLimitsReachedError.code],
    fallbackReason: 'Cannot create workspace project'
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
  const {
    canClickAction: canClickMove,
    canActuallyInvokeAction: canActuallyMove,
    cantClickErrorReason: cantClickMoveReason,
    cantClickErrorCode: cantClickMoveCode,
    check
  } = usePermissionedAction({
    checks: computed(() => [
      unref(params.workspace)?.permissions?.canMoveProjectToWorkspace,
      unref(params.project)?.permissions?.canMoveToWorkspace
    ]),
    disclaimerErrorCodes: [WorkspaceLimitsReachedError.code],
    allowOnMissingCheck: true,
    fallbackReason: 'Cannot move project into workspace'
  })

  return {
    canClickMove,
    canActuallyMove,
    cantClickMoveReason,
    cantClickMoveCode,
    check
  }
}
