import { graphql } from '~~/lib/common/generated/gql'

export const workspaceLastAdminCheckFragment = graphql(`
  fragment WorkspaceLastAdminCheck_Workspace on Workspace {
    id
    team(limit: 50, filter: { roles: ["workspace:admin"] }) {
      items {
        id
      }
    }
  }
`)
