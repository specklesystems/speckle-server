import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  CreateSavedViewInput,
  UseDeleteSavedView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { parseObjectReference } from '~/lib/common/helpers/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const createSavedViewMutation = graphql(`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        createView(input: $input) {
          id
          ...ViewerSavedViewsPanelView_SavedView
          group {
            id
            ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup
          }
        }
      }
    }
  }
`)

export const useCreateSavedView = () => {
  const { mutate } = useMutation(createSavedViewMutation)
  const { userId } = useActiveUser()
  const {
    projectId,
    viewer: { instance: viewerInstance }
  } = useInjectedViewerState()
  const { serialize, buildConcreteResourceIdString } = useStateSerialization()
  const { triggerNotification } = useGlobalToast()

  return async (
    input: Omit<
      CreateSavedViewInput,
      'projectId' | 'resourceIdString' | 'viewerState' | 'screenshot'
    >
  ) => {
    if (!userId.value) return
    const screenshot = await viewerInstance.screenshot()

    const result = await mutate(
      {
        input: {
          ...input,
          projectId: projectId.value,
          resourceIdString: buildConcreteResourceIdString(),
          viewerState: serialize({ concreteResourceIdString: true }),
          screenshot
        }
      },
      {
        update: (cache, { data }) => {
          const res = data?.projectMutations.savedViewMutations.createView
          if (!res) return

          const viewId = res.id
          const groupId = res.group.id

          // Project.savedViewGroups + 1, if it is a new group
          modifyObjectField(
            cache,
            getCacheId('Project', projectId.value),
            'savedViewGroups',
            ({ helpers: { createUpdatedValue, ref, readField }, value }) => {
              const isNewGroup = !value?.items?.some(
                (group) => readField(group, 'id') === groupId
              )
              if (!isNewGroup) return

              return createUpdatedValue(({ update }) => {
                update('totalCount', (count) => count + 1)
                update('items', (items) => [...items, ref('SavedViewGroup', groupId)])
              })
            },
            { autoEvictFiltered: true }
          )

          // SavedViewGroup.views + 1
          modifyObjectField(
            cache,
            getCacheId('SavedViewGroup', groupId),
            'views',
            ({ helpers: { createUpdatedValue, ref } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (count) => count + 1)
                update('items', (items) => [ref('SavedView', viewId), ...items])
              })
            },
            { autoEvictFiltered: true }
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.createView
    if (res?.id) {
      triggerNotification({
        title: 'Saved View Created',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't create saved view",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}

const deleteSavedViewMutation = graphql(`
  mutation DeleteSavedView($input: DeleteSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        deleteView(input: $input)
      }
    }
  }
`)

graphql(`
  fragment UseDeleteSavedView_SavedView on SavedView {
    id
    projectId
    group {
      id
    }
  }
`)

export const useDeleteSavedView = () => {
  const { mutate } = useMutation(deleteSavedViewMutation)
  const { triggerNotification } = useGlobalToast()

  return async (params: { view: UseDeleteSavedView_SavedViewFragment }) => {
    const { id, projectId } = params.view
    const groupId = params.view.group.id

    if (!id || !projectId) {
      return
    }

    const result = await mutate(
      {
        input: {
          projectId,
          id
        }
      },
      {
        update: (cache) => {
          // Remove the view from the cache
          cache.evict({ id: getCacheId('SavedView', id) })

          // Check if default/ungrouped group
          const isDefaultGroup = groupId.startsWith('default-')

          // If default group and its now empty - remove it as it doesn't exist otherwise
          let shouldEvict
          if (isDefaultGroup) {
            let viewsRemain = false
            modifyObjectField(
              cache,
              getCacheId('SavedViewGroup', groupId),
              'views',
              ({ value }) => {
                const otherItems = value?.items?.filter(
                  (item) => item.__ref !== getCacheId('SavedView', id)
                )

                if (otherItems?.length) {
                  viewsRemain = true
                }
              }
            )

            if (!viewsRemain) {
              shouldEvict = true
            }
          }

          // Remove default group, if its empty
          if (shouldEvict) {
            cache.evict({ id: getCacheId('SavedViewGroup', groupId) })
          } else {
            // Remove view from view lists (in groups)
            // SavedViewGroup.views
            modifyObjectField(
              cache,
              getCacheId('SavedViewGroup', groupId),
              'views',
              ({ helpers: { createUpdatedValue } }) => {
                return createUpdatedValue(({ update }) => {
                  update('totalCount', (count) => count - 1)
                  update('items', (items) =>
                    items.filter((item) => parseObjectReference(item).id !== id)
                  )
                })
              },
              { autoEvictFiltered: true }
            )
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.deleteView
    if (!res) {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't delete saved view",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}
