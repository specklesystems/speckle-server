import { userActiveWorkspaceQuery } from '~/lib/user/graphql/queries'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { setActiveWorkspaceMutation } from '~/lib/user/graphql/mutations'
import { modifyObjectField, getCacheId } from '~/lib/common/helpers/graphql'

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
  const { activeUser } = useActiveUser()
  const { mutate } = useMutation(setActiveWorkspaceMutation, {
    update: (cache, { data }) => {
      if (!data?.activeUserMutations?.setActiveWorkspace || !activeUser.value) return

      const newWorkspace = data.activeUserMutations.setActiveWorkspace

      modifyObjectField(
        cache,
        getCacheId('User', activeUser.value.id),
        'activeWorkspace',
        ({ helpers: { ref } }) => {
          return ref('LimitedWorkspace', newWorkspace.id)
        }
      )
    }
  })

  const setActiveWorkspace = async (workspaceSlug: string) => {
    return await mutate({ slug: workspaceSlug })
  }

  return {
    setActiveWorkspace
  }
}
