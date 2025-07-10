import { userActiveWorkspaceQuery } from '~/lib/user/graphql/queries'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { setActiveWorkspaceMutation } from '~/lib/user/graphql/mutations'
import { modifyObjectField, ROOT_QUERY } from '~/lib/common/helpers/graphql'

export const useActiveWorkspace = () => {
  const { result } = useQuery(userActiveWorkspaceQuery)

  const activeWorkspaceSlug = computed(
    () => result.value?.activeUser?.activeWorkspace?.slug
  )

  return {
    activeWorkspaceSlug
  }
}

export const useSetActiveWorkspace = () => {
  const { mutate } = useMutation(setActiveWorkspaceMutation)
  const { activeUser } = useActiveUser()

  const setActiveWorkspace = async (workspaceSlug: string) => {
    const result = await mutate(
      { slug: workspaceSlug },
      {
        update: (cache, { data }) => {
          if (data?.activeUserMutations?.setActiveWorkspace && activeUser.value?.id) {
            // Evict the activeUser field to force a refetch with the new active workspace
            modifyObjectField(
              cache,
              ROOT_QUERY,
              'activeUser',
              ({ variables, helpers: { evict } }) => {
                if (!variables || Object.keys(variables).length === 0) {
                  return evict()
                }
                return undefined
              }
            )
          }
        }
      }
    )
    return result
  }

  return {
    setActiveWorkspace
  }
}
