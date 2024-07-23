import { ApolloServer, gql } from 'apollo-server-express'
import { Workspace } from '@/modules/workspacesCore/domain/types'

type CreateWorkspaceInput = {
  name: string
}

export const createWorkspaceQuery = async (
  apollo: ApolloServer,
  input: CreateWorkspaceInput
): Promise<Workspace> => {
  const { data } = await apollo.executeOperation({
    query: gql`
      mutation ($input: WorkspaceCreateInput!) {
        workspaceMutations {
          create(input: $input) {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `,
    variables: {
      input: {
        name: input.name
      }
    }
  })

  return data?.workspaceMutations.create as Workspace
}

type GetWorkspaceInput = {
  workspaceId: string
}

export const getWorkspaceQuery = async (
  apollo: ApolloServer,
  input: GetWorkspaceInput
): Promise<Workspace> => {
  const { data } = await apollo.executeOperation({
    query: gql`
      query ($workspaceId: String!) {
        workspace(id: $workspaceId) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `,
    variables: {
      workspaceId: input.workspaceId
    }
  })

  if (!data) {
    throw new Error('Workspace not found')
  }

  return data.workspace as Workspace
}

export const getActiveUserWorkspacesQuery = async (
  apollo: ApolloServer
): Promise<Workspace[]> => {
  const { data } = await apollo.executeOperation({
    query: gql`
      query {
        activeUser {
          id
          email
          workspaces {
            items {
              id
            }
          }
        }
      }
    `
  })

  return (data?.activeUser?.workspaces?.items as Workspace[]) ?? []
}

type UpdateWorkspaceInput = {
  workspaceId: string
  workspaceInput: {
    name?: string
    description?: string
  }
}

export const updateWorkspaceQuery = async (
  apollo: ApolloServer,
  input: UpdateWorkspaceInput
): Promise<Workspace> => {
  const { data } = await apollo?.executeOperation({
    query: gql`
      mutation ($input: WorkspaceUpdateInput!) {
        workspaceMutations {
          update(input: $input) {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `,
    variables: {
      input: {
        id: input.workspaceId,
        name: input.workspaceInput.name,
        description: input.workspaceInput.description
      }
    }
  })

  return data?.workspaceMutations.update as Workspace
}
