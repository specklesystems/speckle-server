import { userActiveWorkspaceQuery } from '~/lib/user/graphql/queries'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { setActiveWorkspaceMutation } from '~/lib/user/graphql/mutations'
import { modifyObjectField, getCacheId } from '~/lib/common/helpers/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

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
      if (!activeUser.value) return

      const newWorkspace = data?.activeUserMutations?.setActiveWorkspace

      modifyObjectField(
        cache,
        getCacheId('User', activeUser.value.id),
        'activeWorkspace',
        ({ helpers: { ref } }) => {
          // Handle case where workspace is set to null (personal projects)
          return newWorkspace ? ref('LimitedWorkspace', newWorkspace.id) : null
        }
      )
    }
  })

  const setActiveWorkspace = async (options: {
    slug?: MaybeNullOrUndefined<string>
    id?: MaybeNullOrUndefined<string>
  }) => {
    const { slug, id } = options
    return await mutate(slug ? { slug } : { id: id || null })
  }

  return {
    setActiveWorkspace
  }
}
