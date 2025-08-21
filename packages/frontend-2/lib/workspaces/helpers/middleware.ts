import { activeUserWorkspaceExistenceCheckQuery } from '~/lib/auth/graphql/queries'
import { workspaceAccessCheckQuery } from '~/lib/workspaces/graphql/queries'

export const buildActiveUserWorkspaceExistenceCheckQuery = () => {
  return <const>{
    query: activeUserWorkspaceExistenceCheckQuery,
    variables: {
      filter: {
        personalOnly: true
      },
      limit: 0
    }
  }
}

export const buildWorkspaceAccessCheckQuery = (workspaceSlug: string) => {
  return <const>{
    query: workspaceAccessCheckQuery,
    variables: { slug: workspaceSlug },
    context: {
      skipLoggingErrors: true
    },
    fetchPolicy: 'network-only'
  }
}
