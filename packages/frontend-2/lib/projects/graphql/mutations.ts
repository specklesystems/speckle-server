import { graphql } from '~~/lib/common/generated/gql'

export const createModelMutation = graphql(`
  mutation CreateModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)

export const createProjectMutation = graphql(`
  mutation CreateProject($input: ProjectCreateInput) {
    projectMutations {
      create(input: $input) {
        ...ProjectPageProject
        ...ProjectDashboardItem
      }
    }
  }
`)

export const updateModelMutation = graphql(`
  mutation UpdateModel($input: UpdateModelInput!) {
    modelMutations {
      update(input: $input) {
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)

export const deleteModelMutation = graphql(`
  mutation DeleteModel($input: DeleteModelInput!) {
    modelMutations {
      delete(input: $input)
    }
  }
`)

export const updateProjectRoleMutation = graphql(`
  mutation UpdateProjectRole($input: ProjectUpdateRoleInput!) {
    projectMutations {
      updateRole(input: $input) {
        id
        team {
          role
          user {
            ...LimitedUserAvatar
          }
        }
      }
    }
  }
`)

export const inviteProjectUserMutation = graphql(`
  mutation InviteProjectUser($input: ProjectInviteCreateInput!) {
    projectMutations {
      invites {
        create(input: $input) {
          ...ProjectPageTeamDialog
        }
      }
    }
  }
`)

export const cancelProjectInviteMutation = graphql(`
  mutation CancelProjectInvite($projectId: ID!, $inviteId: String!) {
    projectMutations {
      invites {
        cancel(projectId: $projectId, inviteId: $inviteId) {
          ...ProjectPageTeamDialog
        }
      }
    }
  }
`)
