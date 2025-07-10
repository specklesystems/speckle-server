import { graphql } from '~/lib/common/generated/gql'

export const navigationActiveWorkspaceFragment = graphql(`
  fragment NavigationActiveWorkspace_Workspace on Workspace {
    ...HeaderWorkspaceSwitcherHeaderWorkspace_Workspace
    ...InviteDialogWorkspace_Workspace
    id
    name
    logo
  }
`)
