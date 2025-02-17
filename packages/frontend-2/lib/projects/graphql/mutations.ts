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

export const createWorkspaceProjectMutation = graphql(`
  mutation CreateWorkspaceProject($input: WorkspaceProjectCreateInput!) {
    workspaceMutations {
      projects {
        create(input: $input) {
          ...ProjectPageProject
          ...ProjectDashboardItem
        }
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
          id
          role
          user {
            ...LimitedUserAvatar
          }
        }
      }
    }
  }
`)

export const updateWorkspaceProjectRoleMutation = graphql(`
  mutation UpdateWorkspaceProjectRole($input: ProjectUpdateRoleInput!) {
    workspaceMutations {
      projects {
        updateRole(input: $input) {
          id
          team {
            id
            role
          }
        }
      }
    }
  }
`)

export const inviteProjectUserMutation = graphql(`
  mutation InviteProjectUser($projectId: ID!, $input: [ProjectInviteCreateInput!]!) {
    projectMutations {
      invites {
        batchCreate(projectId: $projectId, input: $input) {
          ...ProjectPageTeamDialog
        }
      }
    }
  }
`)

export const inviteWorkspaceProjectUserMutation = graphql(`
  mutation InviteWorkspaceProjectUser(
    $projectId: ID!
    $inputs: [WorkspaceProjectInviteCreateInput!]!
  ) {
    projectMutations {
      invites {
        createForWorkspace(projectId: $projectId, inputs: $inputs) {
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

export const updateProjectMetadataMutation = graphql(`
  mutation UpdateProjectMetadata($update: ProjectUpdateInput!) {
    projectMutations {
      update(update: $update) {
        id
        ...ProjectUpdatableMetadata
      }
    }
  }
`)

export const deleteProjectMutation = graphql(`
  mutation DeleteProject($id: String!) {
    projectMutations {
      delete(id: $id)
    }
  }
`)

export const useProjectInviteMutation = graphql(`
  mutation UseProjectInvite($input: ProjectInviteUseInput!) {
    projectMutations {
      invites {
        use(input: $input)
      }
    }
  }
`)

export const leaveProjectMutation = graphql(`
  mutation LeaveProject($projectId: String!) {
    projectMutations {
      leave(id: $projectId)
    }
  }
`)

export const deleteVersionsMutation = graphql(`
  mutation DeleteVersions($input: DeleteVersionsInput!) {
    versionMutations {
      delete(input: $input)
    }
  }
`)

export const moveVersionsMutation = graphql(`
  mutation MoveVersions($input: MoveVersionsInput!) {
    versionMutations {
      moveToModel(input: $input) {
        id
      }
    }
  }
`)

export const updateVersionMutation = graphql(`
  mutation UpdateVersion($input: UpdateVersionInput!) {
    versionMutations {
      update(input: $input) {
        id
        message
      }
    }
  }
`)

export const deleteWebhookMutation = graphql(`
  mutation deleteWebhook($webhook: WebhookDeleteInput!) {
    webhookDelete(webhook: $webhook)
  }
`)

export const createWebhookMutation = graphql(`
  mutation createWebhook($webhook: WebhookCreateInput!) {
    webhookCreate(webhook: $webhook)
  }
`)

export const updateWebhookMutation = graphql(`
  mutation updateWebhook($webhook: WebhookUpdateInput!) {
    webhookUpdate(webhook: $webhook)
  }
`)

export const createAutomationMutation = graphql(`
  mutation CreateAutomation($projectId: ID!, $input: ProjectAutomationCreateInput!) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        create(input: $input) {
          id
          ...ProjectPageAutomationsRow_Automation
        }
      }
    }
  }
`)

export const updateAutomationMutation = graphql(`
  mutation UpdateAutomation($projectId: ID!, $input: ProjectAutomationUpdateInput!) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        update(input: $input) {
          id
          name
          enabled
        }
      }
    }
  }
`)

export const createAutomationRevisionMutation = graphql(`
  mutation CreateAutomationRevision(
    $projectId: ID!
    $input: ProjectAutomationRevisionCreateInput!
  ) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        createRevision(input: $input) {
          id
        }
      }
    }
  }
`)

export const triggerAutomationMutation = graphql(`
  mutation TriggerAutomation($projectId: ID!, $automationId: ID!) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        trigger(automationId: $automationId)
      }
    }
  }
`)

export const createTestAutomationMutation = graphql(`
  mutation CreateTestAutomation(
    $projectId: ID!
    $input: ProjectTestAutomationCreateInput!
  ) {
    projectMutations {
      automationMutations(projectId: $projectId) {
        createTestAutomation(input: $input) {
          id
          ...ProjectPageAutomationsRow_Automation
        }
      }
    }
  }
`)

export const useMoveProjectToWorkspaceMutation = graphql(`
  mutation MoveProjectToWorkspace($workspaceId: String!, $projectId: String!) {
    workspaceMutations {
      projects {
        moveToWorkspace(workspaceId: $workspaceId, projectId: $projectId) {
          id
          workspace {
            id
            projects {
              items {
                id
              }
            }
            ...ProjectsMoveToWorkspaceDialog_Workspace
            ...MoveProjectsDialog_Workspace
          }
        }
      }
    }
  }
`)
