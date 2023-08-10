import { ApolloClient } from '@apollo/client/core'
import {
  CommitCreateInput,
  ProjectCreateInput
} from '~~/lib/common/generated/gql/graphql'
import {
  createCommitMutation,
  createProjectMutation,
  createModelMutation,
  projectDetailsQuery,
  modelDetailsQuery
} from '~~/lib/graphql/mutationsAndQueries'
import { useAccountStore } from '~~/store/accounts'

function getValidOrDefaultAccount(
  clientId: string | undefined = undefined
): ApolloClient<unknown> {
  const { defaultAccount, accounts } = storeToRefs(useAccountStore())
  if (!clientId) return defaultAccount.value.client
  const account = accounts.value.find((acc) => acc.accountInfo.id === clientId)
  if (account) return account.client

  throw new Error(`Failed to find a valid account for id ${clientId}`)
}

export function useCreateCommit(clientId: string | undefined = undefined) {
  return async (commit: CommitCreateInput) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.mutate({
      mutation: createCommitMutation,
      variables: { commit }
    })
    return res
  }
}

export function useCreateNewProject(clientId: string | undefined = undefined) {
  return async (input: ProjectCreateInput) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.mutate({
      mutation: createProjectMutation,
      variables: { input }
    })

    if (!res.data?.projectMutations.create.id) {
      console.error(res.errors)
    } else {
      console.log('created project!')
      // success!
    }

    return res
  }
}

export function useCreateNewModel(clientId: string | undefined = undefined) {
  return async (input: { name: string; projectId: string }) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.mutate({
      mutation: createModelMutation,
      variables: { input }
    })

    if (!res.data?.modelMutations.create.id) {
      console.error(res.errors)
    } else {
      console.log('created model!')
      // success!
    }

    return res
  }
}

export function useGetProjectDetails(clientId: string | undefined = undefined) {
  return async (input: { projectId: string }) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.query({
      query: projectDetailsQuery,
      variables: { projectId: input.projectId }
    })

    if (!res.data?.project.id) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project
  }
}

export function useGetModelDetails(clientId: string | undefined = undefined) {
  return async (input: { projectId: string; modelId: string }) => {
    const client = getValidOrDefaultAccount(clientId)
    const res = await client.query({
      query: modelDetailsQuery,
      variables: { ...input }
    })

    if (!res.data?.project.id) {
      console.error(res.errors)
    } else {
      // success!
    }

    return res.data.project.model
  }
}
