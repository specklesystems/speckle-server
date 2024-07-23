import { ApolloServer, gql } from 'apollo-server-express'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import knex from '@/db/knex'

type CreateWorkspaceInput = {
  name: string
}

export const createWorkspaceQuery = async (
  apollo: ApolloServer,
  input: CreateWorkspaceInput
): Promise<Workspace> => {
  const { data } = await apollo?.executeOperation({
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

// TODO: Use gql endpoint when implemented
export const getWorkspaceQuery = async (
  _apollo: ApolloServer,
  input: GetWorkspaceInput
): Promise<Workspace | undefined> => {
  return await knex<Workspace>('workspaces').where({ id: input.workspaceId }).first()
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
