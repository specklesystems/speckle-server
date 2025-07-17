import { userActiveWorkspaceQuery } from '~/lib/user/graphql/queries'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { setActiveWorkspaceMutation } from '~/lib/user/graphql/mutations'

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

  const setActiveWorkspace = async (workspaceSlug: string) => {
    const result = await mutate({ slug: workspaceSlug })
    return result
  }

  return {
    setActiveWorkspace
  }
}
