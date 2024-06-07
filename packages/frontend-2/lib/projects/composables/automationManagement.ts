import type { ApolloCache } from '@apollo/client/core'
import { isNullOrUndefined } from '@speckle/shared'
import { useApolloClient, useMutation, useSubscription } from '@vue/apollo-composable'
import type { Get } from 'type-fest'
import { useLock } from '~/lib/common/composables/singleton'
import {
  type ProjectAutomationsArgs,
  type CreateAutomationMutationVariables,
  type CreateAutomationRevisionMutationVariables,
  type CreateTestAutomationMutationVariables,
  type OnProjectAutomationsUpdatedSubscription,
  type OnProjectTriggeredAutomationsStatusUpdatedSubscription,
  type Project,
  type ProjectAutomationArgs,
  type UpdateAutomationMutation,
  type UpdateAutomationMutationVariables,
  ProjectAutomationsUpdatedMessageType,
  ProjectTriggeredAutomationsStatusUpdatedMessageType,
  type AutomationRunsArgs,
  type Automation
} from '~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~/lib/common/helpers/graphql'
import {
  createAutomationMutation,
  createAutomationRevisionMutation,
  createTestAutomationMutation,
  triggerAutomationMutation,
  updateAutomationMutation
} from '~/lib/projects/graphql/mutations'
import {
  onProjectAutomationsUpdatedSubscription,
  onProjectTriggeredAutomationsStatusUpdatedSubscription
} from '~/lib/projects/graphql/subscriptions'

export function useCreateAutomation() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate: createAutomation } = useMutation(createAutomationMutation)

  return async (input: CreateAutomationMutationVariables) => {
    if (!activeUser.value) return

    const res = await createAutomation(input).catch(convertThrowIntoFetchResult)
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

export function useCreateTestAutomation() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate: createTestAutomation } = useMutation(createTestAutomationMutation)

  return async (input: CreateTestAutomationMutationVariables) => {
    if (!activeUser.value) return

    const res = await createTestAutomation(input).catch(convertThrowIntoFetchResult)
    if (res?.data?.projectMutations?.automationMutations?.createTestAutomation?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Test automation created'
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create test automation',
        description: errMsg
      })
    }

    return res?.data?.projectMutations?.automationMutations?.createTestAutomation?.id
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

    return res?.data?.projectMutations?.automationMutations?.trigger
  }
}

export const useProjectTriggeredAutomationsStatusUpdateTracking = (params: {
  projectId: MaybeRef<string>
  handler?: (
    data: NonNullable<
      Get<
        OnProjectTriggeredAutomationsStatusUpdatedSubscription,
        'projectTriggeredAutomationsStatusUpdated'
      >
    >,
    cache: ApolloCache<unknown>
  ) => void
}) => {
  const { projectId, handler } = params

  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(
      () => `useProjectTriggeredAutomationsStatusUpdateTracking-${unref(projectId)}`
    )
  )
  // const isEnabled = computed(() => !!(hasLock.value || handler))

  const isAutomateModuleEnabled = useIsAutomateModuleEnabled()
  const isEnabled = computed(
    () => isAutomateModuleEnabled.value && !!(hasLock.value || handler)
  )

  const { onResult } = useSubscription(
    onProjectTriggeredAutomationsStatusUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  onResult((res) => {
    const event = res.data?.projectTriggeredAutomationsStatusUpdated
    if (!event || !hasLock.value) return

    // Update model to reflect the new automations status
    apollo.cache.modify({
      id: getCacheId('Model', event.model.id),
      fields: {
        automationsStatus: () => event.version.automationsStatus || null
      }
    })

    // Add run to automation, if new run
    const run = event?.run
    if (
      run &&
      event.type === ProjectTriggeredAutomationsStatusUpdatedMessageType.RunCreated
    ) {
      const automationid = run.automationId
      const automationCacheId = getCacheId('Automation', automationid)

      modifyObjectFields<AutomationRunsArgs, Automation['runs']>(
        apollo.cache,
        automationCacheId,
        (_fieldName, vars, data, { ref }) => {
          const limit = vars['limit']
          let newItems = data['items']

          if (limit !== 0) {
            if (newItems) {
              // Intentionally not slicing off items over limit, cause we have no way of
              // knowing if this is a paginable list w/ more results loaded through fetchMore
              // Also if we slice off the end, we'd need to re-calculate the cursor
              newItems = [ref('AutomateRun', run.id), ...newItems]
            }
          }

          let totalCount = data['totalCount']
          if (!isNullOrUndefined(totalCount)) {
            totalCount++
          }

          return {
            ...data,
            items: newItems,
            totalCount
          }
        },
        { fieldNameWhitelist: ['runs'] }
      )
    }
  })

  onResult((res) => {
    const event = res.data?.projectTriggeredAutomationsStatusUpdated
    if (!event) return

    handler?.(event, apollo.cache)
  })
}

export const useProjectAutomationsUpdateTracking = (params: {
  projectId: MaybeRef<string>

  handler?: (
    data: NonNullable<
      Get<OnProjectAutomationsUpdatedSubscription, 'projectAutomationsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void
}) => {
  const { projectId, handler } = params

  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(() => `useProjectAutomationsUpdateTracking-${unref(projectId)}`)
  )
  const isAutomateModuleEnabled = useIsAutomateModuleEnabled()
  const isEnabled = computed(
    () => isAutomateModuleEnabled.value && !!(hasLock.value || handler)
  )

  const { onResult } = useSubscription(
    onProjectAutomationsUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  onResult((res) => {
    const event = res.data?.projectAutomationsUpdated
    if (!event || !hasLock.value) return

    const projectCacheId = getCacheId('Project', unref(projectId))

    // If created, update local cache
    if (
      event.type === ProjectAutomationsUpdatedMessageType.Created &&
      event.automation
    ) {
      const newAutomation = event.automation

      // Update Project.automation, if somehow it was queried for already (very unlikely, had to have visited a 404 page)
      modifyObjectFields<ProjectAutomationArgs, Project['automation']>(
        apollo.cache,
        projectCacheId,
        (fieldName, vars, _data, { ref }) => {
          if (fieldName !== 'automation') return
          if (vars.id !== newAutomation.id) return

          return ref('Automation', newAutomation.id)
        }
      )

      // Update Project.automations list
      modifyObjectFields<ProjectAutomationsArgs, Project['automations']>(
        apollo.cache,
        projectCacheId,
        (_fieldName, vars, data, { ref, DELETE }) => {
          if (vars['filter']?.length) {
            return DELETE // Evict those lists w/ filters
          }

          const limit = vars['limit']
          let newItems = data['items']

          if (limit !== 0) {
            if (newItems) {
              newItems = [ref('Automation', newAutomation.id), ...newItems]
            }
          }

          let totalCount = data['totalCount']
          if (!isNullOrUndefined(totalCount)) {
            totalCount++
          }

          return {
            ...data,
            items: newItems,
            totalCount
          }
        },
        { fieldNameWhitelist: ['automations'] }
      )
    }
  })

  onResult((res) => {
    const event = res.data?.projectAutomationsUpdated
    if (!event) return

    handler?.(event, apollo.cache)
  })
}
