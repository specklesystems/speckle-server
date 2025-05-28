import type { ApolloCache } from '@apollo/client/core'
import type { Optional } from '@speckle/shared'
import { useApolloClient, useMutation, useSubscription } from '@vue/apollo-composable'
import type { MaybeRef } from '@vueuse/core'
import type { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useLock } from '~~/lib/common/composables/singleton'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ProjectUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import type {
  OnProjectUpdatedSubscription,
  ProjectCreateInput,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  ProjectUpdateInput,
  ProjectUpdateRoleInput,
  UpdateProjectMetadataMutation,
  WorkspaceProjectInviteCreateInput,
  InviteProjectUserMutation,
  Project,
  WorkspaceProjectCreateInput,
  CreateWorkspaceProjectMutation,
  CreateProjectMutation,
  AdminPanelProjectsListQuery
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectField,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  useNavigateToHome,
  workspaceRoute,
  projectRoute
} from '~~/lib/common/helpers/route'
import {
  cancelProjectInviteMutation,
  createProjectMutation,
  deleteProjectMutation,
  inviteProjectUserMutation,
  inviteWorkspaceProjectUserMutation,
  leaveProjectMutation,
  updateProjectMetadataMutation,
  updateProjectRoleMutation,
  updateWorkspaceProjectRoleMutation,
  useProjectInviteMutation,
  useMoveProjectToWorkspaceMutation,
  createWorkspaceProjectMutation
} from '~~/lib/projects/graphql/mutations'
import { onProjectUpdatedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useRouter } from 'vue-router'

export function useProjectUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<Get<OnProjectUpdatedSubscription, 'projectUpdated'>>,
    cache: ApolloCache<unknown>
  ) => void,
  options?: Partial<{
    redirectOnDeletion: boolean
    notifyOnUpdate?: boolean
  }>
) {
  const { redirectOnDeletion, notifyOnUpdate } = options || {}

  const goHome = useNavigateToHome()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(() => `useProjectUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))

  const { onResult: onProjectUpdated } = useSubscription(
    onProjectUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  onProjectUpdated((res) => {
    if (!res.data?.projectUpdated || !hasLock.value) return

    const event = res.data.projectUpdated
    const cache = apollo.cache
    const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

    if (isDeleted) {
      cache.evict({
        id: getCacheId('Project', event.id)
      })

      if (redirectOnDeletion) {
        goHome()
      }

      if (redirectOnDeletion || notifyOnUpdate) {
        triggerNotification({
          type: ToastNotificationType.Info,
          title: isDeleted ? 'Project deleted' : 'Project updated'
        })
      }
    }
  })

  onProjectUpdated((res) => {
    if (!res.data?.projectUpdated) return
    const event = res.data.projectUpdated
    handler?.(event, apollo.cache)
  })
}

export function useCreateProject() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  return async (input: ProjectCreateInput | WorkspaceProjectCreateInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const res = await apollo
      .mutate({
        ...('workspaceId' in input
          ? {
              mutation: createWorkspaceProjectMutation,
              variables: { input }
            }
          : {
              mutation: createProjectMutation,
              variables: { input }
            }),
        update: (cache, { data }) => {
          const typedData = data as
            | CreateWorkspaceProjectMutation
            | CreateProjectMutation
          if (!typedData) return

          modifyObjectFields<undefined, { [key: string]: AdminPanelProjectsListQuery }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              const projectListFields = Object.keys(value).filter(
                (k) =>
                  details.revolveFieldNameAndVariables(k).fieldName === 'projectList'
              )
              const newVal: typeof value = { ...value }
              for (const field of projectListFields) {
                delete newVal[field]
              }
              return newVal
            },
            { fieldNameWhitelist: ['admin'] }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    // not sure why this isn't happening automatically
    const typedData = res.data as Optional<
      CreateWorkspaceProjectMutation | CreateProjectMutation
    >

    const newProject = typedData
      ? 'projectMutations' in typedData
        ? typedData.projectMutations.create
        : typedData.workspaceMutations.projects.create
      : undefined

    if (!newProject?.id) {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project creation failed',
        description: err
      })
    }

    return newProject
  }
}

export function useUpdateUserRole(
  project?: Ref<Pick<Project, 'workspaceId'> | undefined>
) {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const updateProjectRole = async (input: ProjectUpdateRoleInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: updateProjectRoleMutation,
        variables: { input }
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.updateRole.id) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Permission update failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: input.role ? 'Project role updated' : 'User removed from project'
      })
    }

    return data?.projectMutations.updateRole
  }

  const updateWorkspaceProjectRole = async (input: ProjectUpdateRoleInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: updateWorkspaceProjectRoleMutation,
        variables: { input },
        update: (cache) => {
          cache.evict({ id: getCacheId('Project', input.projectId) })
          cache.evict({
            id: getCacheId('WorkspaceCollaborator', input.userId)
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.workspaceMutations.projects.updateRole.id) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Permission update failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: input.role ? 'Project role updated' : 'User removed from project'
      })
    }

    return data?.workspaceMutations.projects
  }

  const isWorkspaceProject =
    isWorkspacesEnabled.value && project?.value?.workspaceId?.length

  return isWorkspaceProject ? updateWorkspaceProjectRole : updateProjectRole
}

export function useInviteUserToProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    projectId: string,
    input: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[],
    options?: { hideToasts?: boolean }
  ) => {
    const userId = activeUser.value?.id
    const { hideToasts } = options || {}
    if (!userId) return

    const isWorkspaceInput = (
      input: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[]
    ): input is WorkspaceProjectInviteCreateInput[] => {
      return input.some((i) => 'workspaceRole' in i)
    }

    let res: Optional<
      InviteProjectUserMutation['projectMutations']['invites']['batchCreate']
    > = undefined
    let err: Optional<string> = undefined
    if (isWorkspaceInput(input)) {
      const { data, errors } = await apollo
        .mutate({
          mutation: inviteWorkspaceProjectUserMutation,
          variables: { inputs: input, projectId }
        })
        .catch(convertThrowIntoFetchResult)
      res = data?.projectMutations.invites.createForWorkspace
      err = !res?.id ? getFirstErrorMessage(errors) : undefined
    } else {
      const { data, errors } = await apollo
        .mutate({
          mutation: inviteProjectUserMutation,
          variables: { input, projectId }
        })
        .catch(convertThrowIntoFetchResult)
      res = data?.projectMutations.invites.batchCreate
      err = !res?.id ? getFirstErrorMessage(errors) : undefined
    }

    if (err && !hideToasts) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title:
          input.length > 1
            ? "Couldn't send project invites"
            : "Couldn't send project invite",
        description: err
      })
    } else {
      if (!hideToasts) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title:
            input.length > 1
              ? 'Project invites successfully sent'
              : 'Project invite successfully sent'
        })
      }
    }

    if (hideToasts && err) {
      throw new Error(err)
    }

    return res
  }
}

export function useCancelProjectInvite() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: { projectId: string; inviteId: string }) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: cancelProjectInviteMutation,
        variables: input
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.invites.cancel) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Invitation cancelation failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Invitation canceled'
      })
    }

    return data?.projectMutations.invites.cancel
  }
}

export function useUpdateProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    update: ProjectUpdateInput,
    options?: Partial<{
      customSuccessMessage?: string
      optimisticResponse: UpdateProjectMetadataMutation
    }>
  ) => {
    if (!activeUser.value) return

    const successMessage = options?.customSuccessMessage || 'Project updated'

    const result = await apollo
      .mutate({
        mutation: updateProjectMetadataMutation,
        variables: { update },
        optimisticResponse: options?.optimisticResponse
      })
      .catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.update?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: successMessage
      })
    } else {
      const errMsg = getFirstErrorMessage(result.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project update failed',
        description: errMsg
      })
    }

    return result.data?.projectMutations.update
  }
}

export function useDeleteProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const navigateHome = useNavigateToHome()
  const router = useRouter()

  return async (
    id: string,
    options?: Partial<{ goHome: boolean; workspaceSlug?: string }>
  ) => {
    if (!activeUser.value) return
    const { goHome, workspaceSlug } = options || {}

    const result = await apollo
      .mutate({
        mutation: deleteProjectMutation,
        variables: {
          id
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.delete) {
      if (goHome) {
        if (workspaceSlug) {
          router.push(workspaceRoute(workspaceSlug))
        } else {
          navigateHome()
        }
      }

      // evict project from cache
      apollo.cache.evict({
        id: getCacheId('Project', id)
      })
    } else {
      const errMsg = getFirstErrorMessage(result.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project deletion failed',
        description: errMsg
      })
    }

    return !!result.data?.projectMutations.delete
  }
}

export function useProcessProjectInvite() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    input: ProjectInviteUseInput,
    options?: Partial<{ inviteId: string; skipToast: boolean }>
  ) => {
    if (!activeUser.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: useProjectInviteMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.projectMutations.invites.use) return

          if (options?.inviteId) {
            // Evict PendingStreamCollaborator
            cache.evict({
              id: getCacheId('PendingStreamCollaborator', options.inviteId)
            })
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!options?.skipToast) {
      if (data?.projectMutations.invites.use) {
        triggerNotification({
          type: input.accept
            ? ToastNotificationType.Success
            : ToastNotificationType.Info,
          title: input.accept ? 'Project invite accepted' : 'Project invite dismissed'
        })
      } else {
        const errMsg = getFirstErrorMessage(errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: "Couldn't process project invite",
          description: errMsg
        })
      }
    }

    return data?.projectMutations.invites.use
  }
}

export function useLeaveProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const navigateHome = useNavigateToHome()

  return async (projectId: string, options?: Partial<{ goHome: boolean }>) => {
    if (!activeUser.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: leaveProjectMutation,
        variables: { projectId },
        update: (cache, { data }) => {
          if (!data?.projectMutations.leave) return

          cache.evict({
            id: getCacheId('Project', projectId)
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.projectMutations.leave) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: "You've left the project"
      })

      if (options?.goHome) navigateHome()
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: "Couldn't leave project",
        description: errMsg
      })
    }
  }
}

export function useMoveProjectToWorkspace() {
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const { mutate } = useMutation(useMoveProjectToWorkspaceMutation)
  const { activeUser } = useActiveUser()

  return async (params: {
    projectId: string
    workspaceId: string
    workspaceName: string
    eventSource?: string
  }) => {
    const userId = activeUser.value?.id
    if (!userId) return
    const { projectId, workspaceId, workspaceName, eventSource } = params

    const res = await mutate(
      { projectId, workspaceId },
      {
        update: (cache, { data }) => {
          if (!data?.workspaceMutations.projects.moveToWorkspace) return
          if (!workspaceId) return

          // Add to workspace.projects
          modifyObjectField(
            cache,
            getCacheId('Workspace', workspaceId),
            'projects',
            ({ helpers: { createUpdatedValue, ref } }) => {
              return createUpdatedValue(({ update }) => {
                update('items', (items) => [ref('Project', projectId), ...items])
              })
            }
          )

          // Remove from personalOnly user projects
          modifyObjectField(
            cache,
            getCacheId('User', userId),
            'projects',
            ({ variables, helpers: { createUpdatedValue, ref } }) => {
              if (!variables.filter?.personalOnly) return
              return createUpdatedValue(({ update }) => {
                update('items', (items) =>
                  items.filter((item) => item.__ref !== ref('Project', projectId).__ref)
                )
              })
            }
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (res?.data?.workspaceMutations.projects.moveToWorkspace.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Moved project to ${workspaceName}`
      })

      mixpanel.track('Project Moved To Workspace', {
        projectId,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId,
        source: eventSource
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: "Couldn't move project",
        description: errMsg
      })
    }

    return res?.data?.workspaceMutations.projects.moveToWorkspace
  }
}

export function useCopyProjectLink() {
  const { copy } = useClipboard()
  const { triggerNotification } = useGlobalToast()

  return async (projectId: string) => {
    if (import.meta.server) {
      throw new Error('Not supported in SSR')
    }

    const path = projectRoute(projectId)
    const url = new URL(path, window.location.toString()).toString()

    await copy(url)
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Project link copied to clipboard'
    })
  }
}
