import { useQuery } from '@vue/apollo-composable'
import { workspaceBySlugQuery } from '~/lib/workspaces/graphql/queries'

export const getWorkspaceIdFromSlug = (slug: string) => {
  const workspaceId = ref<string | undefined>(undefined)

  const { onResult } = useQuery(workspaceBySlugQuery, () => ({
    slug
  }))

  onResult((queryResult) => {
    if (queryResult.data?.workspaceBySlug) {
      workspaceId.value = queryResult.data.workspaceBySlug.id
    }
  })

  return workspaceId
}
