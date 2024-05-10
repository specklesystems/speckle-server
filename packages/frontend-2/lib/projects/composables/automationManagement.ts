import { useMutation } from '@vue/apollo-composable'
import {
  ProjectAutomationsArgs,
  type CreateAutomationMutationVariables,
  type CreateAutomationRevisionMutationVariables,
  type Project,
  type ProjectAutomationArgs,
  type UpdateAutomationMutation,
  type UpdateAutomationMutationVariables
} from '~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~/lib/common/helpers/graphql'
import {
  createAutomationMutation,
  createAutomationRevisionMutation,
  triggerAutomationMutation,
  updateAutomationMutation
} from '~/lib/projects/graphql/mutations'

// TODO: Cache updates

export function useCreateAutomation() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate: createAutomation } = useMutation(createAutomationMutation)

  return async (input: CreateAutomationMutationVariables) => {
    if (!activeUser.value) return

    const res = await createAutomation(input, {
      update: (cache, { data }) => {
        const newAutomation = data?.projectMutations?.automationMutations?.create
        if (!newAutomation) return

        const projectCacheId = getCacheId('Project', input.projectId)

        // Evict Project.automation, if somehow it was queried for already (very unlikely)
        evictObjectFields<ProjectAutomationArgs>(
          cache,
          projectCacheId,
          (fieldName, vars) => {
            if (fieldName !== 'automation') return false
            if (vars.id !== newAutomation.id) return false
            return true
          }
        )

        // Update Project.automations list
        modifyObjectFields<ProjectAutomationsArgs, Project['automations']>(
          cache,
          projectCacheId,
          (_fieldName, vars, data) => {
            if (vars['limit'] === 0) return
            if (vars['filter']?.length) return
            if (data) return
          },
          { fieldNameWhitelist: ['automations'] }
        )
      }
    }).catch(convertThrowIntoFetchResult)
    if (res?.data?.projectMutations?.automationMutations?.create?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Automation created'
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create automation',
        description: errMsg
      })
    }

    return res?.data?.projectMutations.automationMutations.create
  }
}

export function useUpdateAutomation() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate: updateAutomation } = useMutation(updateAutomationMutation)

  return async (
    update: UpdateAutomationMutationVariables,
    options?: Partial<{
      optimisticResponse: UpdateAutomationMutation
      messages?: Partial<{ success: string; failure: string }>
      hideSuccessToast: boolean
    }>
  ) => {
    const { messages, hideSuccessToast } = options || {}
    if (!activeUser.value) return

    const result = await updateAutomation(update, {
      optimisticResponse: options?.optimisticResponse
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.automationMutations.update?.id) {
      if (!hideSuccessToast) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: messages?.success || 'Automation updated'
        })
      }
    } else {
      const errMsg = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: messages?.failure || 'Automation update failed',
        description: errMsg
      })
    }

    return result?.data?.projectMutations.automationMutations.update
  }
}

export function useCreateAutomationRevision() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate } = useMutation(createAutomationRevisionMutation)

  return async (
    input: CreateAutomationRevisionMutationVariables,
    options?: Partial<{
      hideSuccessToast: boolean
    }>
  ) => {
    const { hideSuccessToast } = options || {}
    if (!activeUser.value) return

    const res = await mutate(input).catch(convertThrowIntoFetchResult)
    if (res?.data?.projectMutations?.automationMutations?.createRevision?.id) {
      if (!hideSuccessToast) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Automation revision created'
        })
      }
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create automation revision',
        description: errMsg
      })
    }

    return res?.data?.projectMutations?.automationMutations?.createRevision
  }
}

export const useTriggerAutomation = () => {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate } = useMutation(triggerAutomationMutation)

  return async (projectId: string, automationId: string) => {
    if (!activeUser.value) return

    const res = await mutate({
      projectId,
      automationId
    }).catch(convertThrowIntoFetchResult)

    if (res?.data?.projectMutations?.automationMutations?.trigger) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Automation triggered'
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to trigger automation',
        description: errMsg
      })
    }

    return !!res?.data?.projectMutations?.automationMutations?.trigger
  }
}
